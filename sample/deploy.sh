#!/bin/bash

$(pulumi stack output getAksCredentials) --overwrite-existing
kubectl apply -f sample/manifest.yaml