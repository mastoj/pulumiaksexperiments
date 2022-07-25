#!/bin/bash

helm template stable/traefik --set dashboard.enabled=true,rbac.enabled=true > kubernetes/traefikv1.yml