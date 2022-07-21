import { RoleAssignment, PrincipalType } from '@pulumi/azure-native/authorization';
import { ManagedCluster, OSType, listManagedClusterUserCredentials } from '@pulumi/azure-native/containerservice';
import { Subnet, VirtualNetwork } from '@pulumi/azure-native/network';
import { Application, ServicePrincipal, ServicePrincipalPassword } from '@pulumi/azuread';
import { Provider as AzureAdProvider } from '@pulumi/azuread';
import { ComponentResource, ComponentResourceOptions, Output, Input, Config } from '@pulumi/pulumi'
import * as pulumi from '@pulumi/pulumi'; 

export type ClusterArgs = {
    resourceGroupName: Input<string>;
    subscriptionId: Input<string>;
}

export class Cluster extends ComponentResource {

    public kubeConfig: Output<string>;
    public servicePrincipalId: Output<string>;
    public clusterName: Output<string>;

    constructor(name: string, args: ClusterArgs, opts?: ComponentResourceOptions) {
        super("tomasja:Cluster", name, args, opts);
        const azureOptions = {...opts, parent: this};
        const azureAdProvider = new AzureAdProvider("azuread");
        const azureAdOptions = {...azureOptions, provider: azureAdProvider};

        const config = new Config("kubernetes");
        const kubernetesVersion = config.get("version");
        const { resourceGroupName, subscriptionId } = args;
        const prefix = "cluster";
        const adApp = new Application(`${prefix}-adapp`, {
            displayName: "AKS Demo App",
        }, azureAdOptions);

        const adSp = new ServicePrincipal(`${prefix}-adsp`, {
            applicationId: adApp.applicationId,
        }, azureAdOptions);

        const adSpPassword = new ServicePrincipalPassword(`${prefix}-adsp-password`, {
            servicePrincipalId: adSp.id,
            endDate: "2099-12-31T23:59:59Z",
        }, azureAdOptions);

        const vnet = new VirtualNetwork(`${prefix}-vnet`, {
            resourceGroupName: resourceGroupName,
            addressSpace: {
                addressPrefixes: ["10.0.0.0/16"],
            }
        }, azureOptions)

        const subnet = new Subnet(`${prefix}-subnet`, {
            resourceGroupName: resourceGroupName,
            addressPrefix: "10.0.0.0/20",
            virtualNetworkName: vnet.name,
        }, azureOptions);
        const subnetAssignment = new RoleAssignment("subnet-permissions", 
        {
            principalId: adSp.id,
            principalType: PrincipalType.ServicePrincipal,
            roleDefinitionId: pulumi.output(subscriptionId).apply(y =>`/subscriptions/${y}/providers/Microsoft.Authorization/roleDefinitions/4d97b98b-1d4f-4787-a291-c67834d212e7`),
            scope: subnet.id,
        }, azureOptions);

        let delayedAdSpPasswordValue = adSpPassword.value.apply(async (val) => {
            // Wait for 30s
            console.log("Waiting for 30s for AD Service Principal eventual consistency...");
            //await new Promise(resolve => setTimeout(resolve, 30000));
            await new Promise(resolve => setTimeout(resolve, 30));
            return val;
        });

        const aks = new ManagedCluster(`${prefix}-aks`, {
            resourceGroupName: resourceGroupName,
            resourceName: `${prefix}-aks`,
            kubernetesVersion: kubernetesVersion,
            dnsPrefix: "dns",
            agentPoolProfiles: [
                {
                    name: `agentpool`,
                    mode: "System",
                    count: 2,
                    minCount: 2,
                    maxCount: 10,
                    vmSize: "Standard_B2ms",
                    osType: OSType.Linux,
                    maxPods: 110,
                    vnetSubnetID: subnet.id,
                    enableAutoScaling: true,
                    orchestratorVersion: kubernetesVersion,
                }
            ],
            servicePrincipalProfile: {
                clientId: adSp.applicationId,
                secret: delayedAdSpPasswordValue,
            },
            enableRBAC: true,
            networkProfile: {
                networkPlugin: "azure",
                serviceCidr: "10.10.0.0/16",
                dnsServiceIP: "10.10.0.10",
                dockerBridgeCidr: "172.17.0.1/16",
            }
        }, {...azureOptions, 
            dependsOn: [subnetAssignment],
        })

        const kubeCredentials =
            pulumi
                .all([resourceGroupName, aks.name])
                .apply(([rg, name]) =>
                    listManagedClusterUserCredentials({
                        resourceGroupName: rg,
                        resourceName: name,
                }));

        const decodeBase64 = (str: string) => Buffer.from(str, "base64").toString("ascii");

        this.kubeConfig = pulumi.secret(kubeCredentials.kubeconfigs[0].value.apply(decodeBase64));
        this.servicePrincipalId = adSp.id;
        this.clusterName = aks.name;
    }
}