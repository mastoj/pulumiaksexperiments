import { getClientConfig } from "@pulumi/azure-native/authorization";
import { ResourceGroup } from "@pulumi/azure-native/resources";
import { Cluster } from "./cluster";
import { Acr } from "./acr";

const prefix = "aksdemo";

const clientConfig = getClientConfig();
const subscriptionId = clientConfig.then(y => y.subscriptionId);

const resourceGroup = new ResourceGroup(`${prefix}-rg`);
const cluster = new Cluster(`${prefix}-cluster`, { 
    resourceGroupName: resourceGroup.name,
    subscriptionId: subscriptionId,
});
const acr = new Acr(`${prefix}-acr`, {
    subscriptionId: subscriptionId,
    servicePrincipalId: cluster.servicePrincipalId,
    resourceGroupName: resourceGroup.name,
})

export const kubeConfig = cluster.kubeConfig;