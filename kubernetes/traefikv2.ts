import { Namespace } from "@pulumi/kubernetes/core/v1";
import { ComponentResource, ComponentResourceOptions, Output } from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { ConfigFile } from "@pulumi/kubernetes/yaml";
import { Chart } from "@pulumi/kubernetes/helm/v3";

export class Traefikv2 extends ComponentResource {
    public publicIp: Output<string>;

    constructor(name: string, args: {  }, opts?: ComponentResourceOptions) {
        super("tomasja:Traefikv2", name, args, opts);

        const namespace = new Namespace("traefikv2-namespace", {
            metadata: {
                name: "traefikv2",
            }
        }, { ...opts, parent: this });

        // const traefik = new Chart("traefikv2", {
        //     chart: "traefik",
        //     namespace: "traefikv2",
        //     // repo: "traefik",
        //     fetchOpts: {
        //         repo: "https://helm.traefik.io/traefik",
        //     }
        // })

        const traefik = new ConfigFile("traefik", {
            file: "kubernetes/traefikv2.yml",
            transformations: [
                (obj) => {
                    if (obj.kind === "Ingress" && obj.metadata.name === "traefikv2-dashboard") {
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
                    obj.metadata.namespace = "traefikv2";
                }
            ]
        }, { ...opts, parent: this, dependsOn: namespace });

        const traefikv2Resources = traefik.resources.apply(t => Object.values(t));

        const svc = k8s.core.v1.Service.get("traefikv2", "traefikv2/traefikv2", {...opts, dependsOn: traefikv2Resources, parent: traefik});
        this.publicIp = svc.status.loadBalancer.ingress[0].ip;
    }
}