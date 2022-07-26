import { ComponentResource, ComponentResourceOptions, Output, Input, Config } from '@pulumi/pulumi'
import { Linkerd } from './linkerd';
import { Viz } from './viz';
import { Traefikv1 } from './traefikv1';
import { Traefikv2 } from './traefikv2';
import * as pulumi from '@pulumi/pulumi';

export class Kubernetes extends ComponentResource {
    public publicTraefikv2Ip: Output<string>;
    constructor(name: string, args: {  }, opts?: ComponentResourceOptions) {
        super("tomasja:Kubernetes", name, args, opts);

        const linkerd = new Linkerd(`linkerd`, {}, {...opts, parent: this });
        const viz = new Viz("viz", {}, { ...opts, parent: this, dependsOn: linkerd.ready });
        const traefikv2 = new Traefikv2("traefikv2", { }, { ...opts, parent: this, dependsOn: [linkerd] });

        this.publicTraefikv2Ip = traefikv2.publicIp;
    }
}