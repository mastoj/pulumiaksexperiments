import { PrincipalType, RoleAssignment } from '@pulumi/azure-native/authorization';
import { Registry, SkuName } from '@pulumi/azure-native/containerregistry';
import { ComponentResource, ComponentResourceOptions, Input } from '@pulumi/pulumi';
import * as pulumi from '@pulumi/pulumi';

export type AcrArgs = {
    servicePrincipalId: Input<string>;
    resourceGroupName: Input<string>;
    subscriptionId: Input<string>;
}

export class Acr extends ComponentResource {
    constructor(name: string, args: AcrArgs, opts?: ComponentResourceOptions) {
        super("tomasja:Acr", name, args, opts);

        const { servicePrincipalId, resourceGroupName, subscriptionId } = args;
        const acr = new Registry(`acr-registry`, {
            registryName: "pulumiaksdemo",
            resourceGroupName: resourceGroupName,
            sku: {
                name: SkuName.Basic,
            },
            adminUserEnabled: false,    
        }, {
            parent: this
        })
        
        const acrAssignment = new RoleAssignment("acr-permissions", {
            principalId: servicePrincipalId,
            principalType: PrincipalType.ServicePrincipal,
            roleDefinitionId: pulumi.output(subscriptionId).apply(y =>`/subscriptions/${y}/providers/Microsoft.Authorization/roleDefinitions/7f951dda-4ed3-4680-a7ca-43fe172d538d`),
            scope: acr.id,
        }, {
            parent: this
        });
    }
}