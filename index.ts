import { Kubernetes } from "./kubernetes";
import { Provider as KubernetesProvider } from "@pulumi/kubernetes";
import { Azure } from "./azure";
import { Dnsimple } from "./dnsimple";
import * as pulumi from "@pulumi/pulumi";

const prefix = "aksdemo";

const azure = new Azure(`${prefix}-azure`, prefix, {});

const k8sProvider = new KubernetesProvider(`${prefix}-k8s`, { 
    kubeconfig: azure.kubeConfig,
});
const kubernetes = new Kubernetes(`${prefix}-kubernetes`, {}, { provider: k8sProvider, dependsOn: [azure] });
const dnsimple = new Dnsimple(`${prefix}-dnsimple`, { traefikv1Ip: kubernetes.publicTraefikv1Ip, traefikv2Ip: kubernetes.publicTraefikv2Ip });

export const kubeConfig = azure.kubeConfig;
export const getAksCredentials = 
    pulumi.all([azure.clusterName, azure.resourceGroupName])
        .apply(([clusterName, resourceGroupName]) => `az aks get-credentials -n ${clusterName} -g ${resourceGroupName}`);
export const publicTraefikv1Ip = kubernetes.publicTraefikv1Ip;