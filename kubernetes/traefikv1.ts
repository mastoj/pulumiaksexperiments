import { Chart } from "@pulumi/kubernetes/helm/v3";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

export class Traefikv1 extends ComponentResource {
    constructor(name: string, args: {  }, opts?: ComponentResourceOptions) {
        super("tomasja:Traefikv1", name, args, opts);

        const chart = new Chart("traefikv1", {
            chart: "stable/traefik",
            values: {
                "dashboard.enabled": "false",
            }
        }, { ...opts, parent: this });
    }
}