import { Namespace } from "@pulumi/kubernetes/core/v1";
import { ComponentResource, ComponentResourceOptions, Output } from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { ConfigFile } from "@pulumi/kubernetes/yaml";

export class Traefikv1 extends ComponentResource {
    public publicIp: Output<string>;

    constructor(name: string, args: {  }, opts?: ComponentResourceOptions) {
        super("tomasja:Traefikv1", name, args, opts);

        const namespace = new Namespace("traefikv1-namespace", {
            metadata: {
                name: "traefikv1",
            }
        }, { ...opts, parent: this });

        const traefik = new ConfigFile("traefik", {
            file: "kubernetes/traefikv1.yml",
            transformations: [
                (obj) => {
                    if (obj.kind === "Ingress" && obj.metadata.name === "traefikv1-dashboard") {
                        obj.metadata.annotations = {
                            ...obj.metadata.annotations,
                            "pulumi.com/skipAwait": "true"
                        }
                    } else {
                        obj.metadata.annotations = {
                            ...obj.metadata.annotations,
                            "pulumi.com/timeoutSeconds": "60"
                        }
                    }
                },
                (obj) => {
                    obj.metadata.namespace = "traefikv1";
                }
            ]
        }, { ...opts, parent: this, dependsOn: namespace });

        const traefikv1Resources = traefik.resources.apply(t => Object.values(t));

        const svc = k8s.core.v1.Service.get("traefikv1", "traefikv1/traefikv1", {...opts, dependsOn: traefikv1Resources, parent: traefik});
        this.publicIp = svc.status.loadBalancer.ingress[0].ip;
    }
}