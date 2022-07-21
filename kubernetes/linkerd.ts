import { ConfigFile } from "@pulumi/kubernetes/yaml";
import { ComponentResource, ComponentResourceOptions, Config, CustomResource, Output } from "@pulumi/pulumi";

export type LinkerdArgs = {
}

export class Linkerd extends ComponentResource {
    public ready: Output<CustomResource[]>;

    constructor(name: string, args: LinkerdArgs, opts?: ComponentResourceOptions) {
        super("tomasja:Linkerd", name, args, opts);
        
        const config = new Config("linkerd");

        const configOverrides = config.getSecret("configOverrides");
        const issuerCrt = config.getSecret("issuerCrt");
        const issuerKey = config.getSecret("issuerKey");
        const policyValidatorCrt = config.getSecret("policyValidatorCrt");
        const policyValidatorKey = config.getSecret("policyValidatorKey");
        const proxyInjectorCrt = config.getSecret("proxyInjectorCrt");
        const proxyInjectorKey = config.getSecret("proxyInjectorKey");
        const spValidatorCrt = config.getSecret("spValidatorCrt");
        const spValidatorKey = config.getSecret("spValidatorKey");

        const linkerd = new ConfigFile("linkerd", {
            file: "kubernetes/linkerd.yml",
            transformations: [
                (obj: any) => {
                    if (obj.kind === "Secret" && obj.metadata.name === "linkerd-config-overrides") {
                        obj.data["linkerd-config-overrides"] = configOverrides
                    }
                },
                (obj: any) => {
                    if (obj.kind === "Secret" && obj.metadata.name === "linkerd-identity-issuer") {
                        obj.data["crt.pem"] = issuerCrt;
                        obj.data["key.pem"] = issuerKey;
                    }
                },
                (obj: any) => {
                    if (obj.kind === "Secret" && obj.metadata.name === "linkerd-policy-validator-k8s-tls") {
                        obj.data["tls.crt"] = policyValidatorCrt;
                        obj.data["tls.key"] = policyValidatorKey;
                    }
                },
                (obj: any) => {
                    if (obj.kind === "ValidatingWebhookConfiguration" && obj.metadata.name === "linkerd-policy-validator-webhook-config") {
                        obj.webhooks[0].clientConfig.caBundle = policyValidatorCrt;
                    }
                },
                (obj: any) => {
                    if (obj.kind === "Secret" && obj.metadata.name === "linkerd-proxy-injector-k8s-tls") {
                        obj.data["tls.crt"] = proxyInjectorCrt;
                        obj.data["tls.key"] = proxyInjectorKey;
                    }
                },
                (obj: any) => {
                    if (obj.kind === "MutatingWebhookConfiguration" && obj.metadata.name === "linkerd-proxy-injector-webhook-config") {
                        obj.webhooks[0].clientConfig.caBundle = proxyInjectorCrt;
                    }
                },
                (obj: any) => {
                    if (obj.kind === "Secret" && obj.metadata.name === "linkerd-sp-validator-k8s-tls") {
                        obj.data["tls.crt"] = spValidatorCrt;
                        obj.data["tls.key"] = spValidatorKey;
                    }
                },
                (obj: any) => {
                    if (obj.kind === "ValidatingWebhookConfiguration" && obj.metadata.name === "linkerd-sp-validator-webhook-config") {
                        obj.webhooks[0].clientConfig.caBundle = spValidatorCrt;
                    }
                },
            ],
        }, {
            ...opts,
            parent: this,
        });
        this.ready = linkerd.resources.apply(t => Object.values(t));
    }
}