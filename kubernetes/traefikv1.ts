import { Namespace } from "@pulumi/kubernetes/core/v1";
import { Chart } from "@pulumi/kubernetes/helm/v3";
import { ComponentResource, ComponentResourceOptions, Output } from "@pulumi/pulumi";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export class Traefikv1 extends ComponentResource {
    public publicIp: Output<string>;

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

        const svc = 
            chart.ready.apply(() => {
                return k8s.core.v1.Service.get("traefikv1", "traefikv1/traefikv1", opts);
            });  
        this.publicIp = svc.status.loadBalancer.ingress[0].ip;

        // const svc = k8s.core.v1.Service.get(`traefikv1`, 
        //     pulumi.interpolate `${chart. traefikv1-dashboard`
        // , opts)
        //     // chart.ready.apply(() =>
        //     //     kq.list("v1", "Service")
        //     //         .filter("")



        //     //     resources
        //     //         .find((resource: any) => {
        //     //             console.log("==> Resource: ", resource);
        //     //             return resource.kind === "Service" && resource.metadata.name === "traefikv1";
        //     //         })
        //     //         .status.loadBalancer.ingress[0].ip as string);
    }
}