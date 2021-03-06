import { getClientConfig } from "@pulumi/azure-native/authorization";
import { ResourceGroup } from "@pulumi/azure-native/resources";
import { Provider as AzureProvider } from "@pulumi/azure-native/provider";
import { ComponentResource, ComponentResourceOptions, Config, Output, secret } from "@pulumi/pulumi";
import { Acr } from "./acr";
import { Cluster } from "./cluster";


export class Azure extends ComponentResource {
    public kubeConfig: Output<string>;
    public resourceGroupName: Output<string>;
    public clusterName: Output<string>;

    constructor(name: string, prefix: string, args: {  }, opts?: ComponentResourceOptions) {
        super("tomasja:Azure", name, args, opts);
        const azureConfig = new Config("azure-native");
        const azureProvider = new AzureProvider("azure", {
            clientId: azureConfig.require("clientId"),
            clientSecret: azureConfig.require("clientSecret"),
            tenantId: azureConfig.require("tenantId"),
            subscriptionId: azureConfig.require("subscriptionId"),
        });
        const azureOptions = {...opts, parent: this, provider: azureProvider};
        const clientConfig = getClientConfig(azureOptions);
        const subscriptionId = clientConfig.then(y => y.subscriptionId);

        const resourceGroup = new ResourceGroup(`${prefix}-rg`, {
            resourceGroupName: `${prefix}-rg`,
            location: azureConfig.require("location"),
        }, azureOptions);
        const cluster = new Cluster(`${prefix}-cluster`, { 
            resourceGroupName: resourceGroup.name,
            subscriptionId: subscriptionId,
        }, azureOptions);
        
        const acr = new Acr(`${prefix}-acr`, {
            subscriptionId: subscriptionId,
            servicePrincipalId: cluster.servicePrincipalId,
            resourceGroupName: resourceGroup.name,
        }, azureOptions);

        this.kubeConfig = secret(cluster.kubeConfig);
        this.resourceGroupName = resourceGroup.name;
        this.clusterName = cluster.clusterName;
    }
}
