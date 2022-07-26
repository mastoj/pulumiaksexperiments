import { ComponentResource, ComponentResourceOptions, Config, Input } from "@pulumi/pulumi";
import { Provider as DnsimpleProvider, Record, RecordTypes } from "@pulumi/dnsimple";
import * as pulumi from "@pulumi/pulumi";

export type DnsimpleArgs = {
    traefikv1Ip: Input<string>
    traefikv2Ip: Input<string>
}

export class Dnsimple extends ComponentResource {
    constructor(name: string, args: DnsimpleArgs, opts?: ComponentResourceOptions) {
        super("tomasja:Dnsimple", name, args, opts);
        const config = new Config("dnsimple");

        const provider = new DnsimpleProvider("dnsimple", {
            account: config.requireSecret("account"),
            token: config.requireSecret("token"),
        });

        const dnsimpleOptions = {...opts, parent: this, provider: provider};
        const record = new Record(`traefikv1-record`, {
            domain: "2mas.xyz",
            name: "*.pulumiaksdemo",
            ttl: "3600",
            type: RecordTypes.A,
            value: args.traefikv2Ip,
            // value: pulumi.interpolate `${args.traefikv1Ip} *.pulumiaksdemo.2mas.xyz`,

        }, dnsimpleOptions);

        const record2 = new Record(`traefikv2-record`, {
            domain: "2mas.xyz",
            name: "*.pulumiaksdemo2",
            ttl: "3600",
            type: RecordTypes.A,
            value: args.traefikv2Ip,
            // value: pulumi.interpolate `${args.traefikv1Ip} *.pulumiaksdemo.2mas.xyz`,

        }, dnsimpleOptions);

    }
}