import { ComponentResource, ComponentResourceOptions, Output, Input, Config } from '@pulumi/pulumi'
import { Linkerd } from './linkerd';
import { Viz } from './viz';
import { Traefikv1 } from './traefikv1';

export class Kubernetes extends ComponentResource {
    constructor(name: string, args: {  }, opts?: ComponentResourceOptions) {
        super("tomasja:Kubernetes", name, args, opts);

        const linkerd = new Linkerd(`linkerd`, {}, {...opts, parent: this });
        const viz = new Viz("viz", {}, { ...opts, parent: this, dependsOn: linkerd.ready });
        const traefikv1 = new Traefikv1("traefikv1", { }, { ...opts, parent: this, dependsOn: [linkerd] });
    }
}