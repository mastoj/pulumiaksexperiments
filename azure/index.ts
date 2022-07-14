import { getClientConfig } from "@pulumi/azure-native/authorization";
import { ResourceGroup } from "@pulumi/azure-native/resources";
import { ComponentResource, ComponentResourceOptions, Output, secret } from "@pulumi/pulumi";
import { Acr } from "./acr";
import { Cluster } from "./cluster";


export class Azure extends ComponentResource {
    public kubeConfig: Output<string>;
    public resourceGroupName: Output<string>;
    public clusterName: Output<string>;

    constructor(name: string, prefix: string, args: {  }, opts?: ComponentResourceOptions) {
        super("tomasja:Azure", name, args, opts);
        const azureOptions = {...opts, parent: this};
        const clientConfig = getClientConfig();
        const subscriptionId = clientConfig.then(y => y.subscriptionId);
        
        const resourceGroup = new ResourceGroup(`${prefix}-rg`, {}, azureOptions);
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
