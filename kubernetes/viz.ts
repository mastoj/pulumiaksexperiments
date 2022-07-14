import { ConfigFile } from "@pulumi/kubernetes/yaml";
import { ComponentResource, ComponentResourceOptions, Config } from "@pulumi/pulumi";

export type VizArgs = { }
export class Viz extends ComponentResource {

    constructor(name: string, args: {  }, opts?: ComponentResourceOptions) {
        super("tomasja:Viz", name, args, opts);

        const vizConfig = new Config("viz");

        const tapCrt = vizConfig.getSecret("tapCrt");
        const tapKey = vizConfig.getSecret("tapKey");
        const tapInjectorCrt = vizConfig.getSecret("tapInjectorCrt");
        const tapInjectorKey = vizConfig.getSecret("tapInjectorKey");
        const viz = new ConfigFile("viz", {
            file: "kubernetes/viz.yml",
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
