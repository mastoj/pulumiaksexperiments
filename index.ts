import { getClientConfig, PrincipalType, RoleAssignment } from "@pulumi/azure-native/authorization";
import { Registry, SkuName } from "@pulumi/azure-native/containerregistry";
import { listManagedClusterUserCredentials, ManagedCluster } from "@pulumi/azure-native/containerservice";
import { OSType } from "@pulumi/azure-native/containerservice/v20170831";
import { Subnet, VirtualNetwork } from "@pulumi/azure-native/network";
import { ResourceGroup } from "@pulumi/azure-native/resources";
import { Application, ServicePrincipal, ServicePrincipalPassword } from "@pulumi/azuread";
import * as pulumi from "@pulumi/pulumi";
import { RandomPassword } from "@pulumi/random";


const prefix = "aksdemo";
const resourceGroup = new ResourceGroup(`${prefix}-rg`);

const adApp = new Application(`${prefix}-adapp`, {
    displayName: "AKS Demo App",
});

const adSp = new ServicePrincipal(`${prefix}-adsp`, {
    applicationId: adApp.applicationId,
});

const adSpPassword = new ServicePrincipalPassword(`${prefix}-adsp-password`, {
    servicePrincipalId: adSp.id,
    endDate: "2099-12-31T23:59:59Z",
});

const vnet = new VirtualNetwork(`${prefix}-vnet`, {
    resourceGroupName: resourceGroup.name,
    addressSpace: {
        addressPrefixes: ["10.0.0.0/16"],
    }
})

const subnet = new Subnet(`${prefix}-subnet`, {
    resourceGroupName: resourceGroup.name,
    addressPrefix: "10.0.0.0/24",
    virtualNetworkName: vnet.name,
});

const clientConfig = getClientConfig();
const subscriptionId = clientConfig.then(y => y.subscriptionId);
const subnetAssignment = new RoleAssignment("subnet-permissions", 
{
    principalId: adSp.id,
    principalType: PrincipalType.ServicePrincipal,
    roleDefinitionId: subscriptionId.then(y =>`/subscriptions/${y}/providers/Microsoft.Authorization/roleDefinitions/4d97b98b-1d4f-4787-a291-c67834d212e7`),
    scope: subnet.id,
});

const aks = new ManagedCluster(`${prefix}-aks`, {
    resourceGroupName: resourceGroup.name,
    kubernetesVersion: "1.21.7",
    dnsPrefix: "dns",
    agentPoolProfiles: [
        {
            name: "agentpool",
            mode: "System",
            count: 2,
            minCount: 2,
            maxCount: 10,
            vmSize: "Standard_B2ms",
            osType: OSType.Linux,
            maxPods: 110,
            vnetSubnetID: subnet.id,
            enableAutoScaling: true,
        }
    ],
    servicePrincipalProfile: {
        clientId: adApp.applicationId,
        secret: adSpPassword.value,
    },
    enableRBAC: true,
    networkProfile: {
        networkPlugin: "azure",
        serviceCidr: "10.10.0.0/16",
        dnsServiceIP: "10.10.0.10",
        dockerBridgeCidr: "172.17.0.1/16",
    }
}, {
    dependsOn: [subnetAssignment],
})

const kubeCredentials =
    pulumi
        .all([resourceGroup.name, aks.name])
        .apply(([rg, name]) =>
            listManagedClusterUserCredentials({
                resourceGroupName: rg,
                resourceName: name,
        }));

const decodeBase64 = (str: string) => Buffer.from(str, "base64").toString("ascii");

const acr = new Registry(`${prefix}-acr`, {
    registryName: "pulumiaksdemo",
    resourceGroupName: resourceGroup.name,
    sku: {
        name: SkuName.Basic,
    },
    adminUserEnabled: false,    
})

const acrAssignment = new RoleAssignment("acr-permissions", {
    principalId: adSp.id,
    principalType: PrincipalType.ServicePrincipal,
    roleDefinitionId: subscriptionId.then(y =>`/subscriptions/${y}/providers/Microsoft.Authorization/roleDefinitions/7f951dda-4ed3-4680-a7ca-43fe172d538d`),
    scope: acr.id,
});

export const kubeConfig = pulumi.secret(kubeCredentials.kubeconfigs[0].value.apply(decodeBase64))
