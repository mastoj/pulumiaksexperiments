import { Namespace } from "@pulumi/kubernetes/core/v1";
import { Chart } from "@pulumi/kubernetes/helm/v3";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

export class Traefikv1 extends ComponentResource {
    constructor(name: string, args: {  }, opts?: ComponentResourceOptions) {
        super("tomasja:Traefikv1", name, args, opts);

        const namespace = new Namespace("traefikv1-namespace", {
            metadata: {
                name: "traefikv1",
            }
        }, { ...opts, parent: this });

        const chart = new Chart("traefikv1", {
            chart: "stable/traefik",
            namespace: "traefikv1",
            values: {
                dashboard: {
                    enabled: true
                },
                rbac: {
                    enabled: true
                }
            },
            transformations: [
                (obj) => {
                    if (obj.kind === "Ingress" && obj.metadata.name === "traefikv1-dashboard") {
                        obj.metadata.annotations = {
                            ...obj.metadata.annotations,
                            "pulumi.com/skipAwait": "true"
                        }
                    }
                }
            ]
        }, { ...opts, parent: this });
    }
}