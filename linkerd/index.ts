import { ConfigFile } from '@pulumi/kubernetes/yaml';
import { ComponentResource, ComponentResourceOptions, Output, Input, Config } from '@pulumi/pulumi'

type VizArgs = { }
class Viz extends ComponentResource {

    constructor(name: string, args: {  }, opts?: ComponentResourceOptions) {
        super("tomasja:Viz", name, args, opts);

        const vizConfig = new Config("viz");

        const tapCrt = vizConfig.getSecret("tapCrt");
        const tapKey = vizConfig.getSecret("tapKey");
        const tapInjectorCrt = vizConfig.getSecret("tapInjectorCrt");
        const tapInjectorKey = vizConfig.getSecret("tapInjectorKey");
        const viz = new ConfigFile("viz", {
            file: "linkerd/viz.yml",
            transformations: [
                (obj: any) => {
                    if (obj.kind === "Secret" && obj.metadata.name === "tap-k8s-tls") {
                        obj.data["tls.crt"] = tapCrt;
                        obj.data["tls.key"] = tapKey;
                    }
                },
                (obj: any) => {
                    if (obj.kind === "APIService" && obj.metadata.name === "v1alpha1.tap.linkerd.io") {
                        obj.spec.caBundle = tapCrt;
                    }
                },
                (obj: any) => {
                    if (obj.kind === "Secret" && obj.metadata.name === "tap-injector-k8s-tls") {
                        obj.data["tls.crt"] = tapInjectorCrt;
                        obj.data["tls.key"] = tapInjectorKey;
                    }
                },
                (obj: any) => {
                    if (obj.kind === "MutatingWebhookConfiguration" && obj.metadata.name === "linkerd-tap-injector-webhook-config") {
                        obj.webhooks[0].clientConfig.caBundle = tapInjectorCrt;
                    }
                },
           ],
        }, {
            ...opts,
            parent: this,
        });
    }
}

export type LinkerdArgs = {
}

export class Linkerd extends ComponentResource {

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
            file: "linkerd/manifest.yml",
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

        const viz = new Viz("viz", {}, { parent: this, dependsOn: [this] });
    }
}