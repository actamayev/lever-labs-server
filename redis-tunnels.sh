#!/bin/bash

case "$1" in
  staging)
    echo "Starting staging tunnel on port 6380..."
    ssh -i ~/Documents/lever-labs-staging-ec2-keypair.pem \
        -N -L 127.0.0.1:6380:master.lever-labs-staging-valkey.c1qdln.use1.cache.amazonaws.com:6379 \
        ubuntu@34.229.209.115
    ;;
  production)
    echo "Starting production tunnel on port 6381..."
    ssh -i ~/Documents/lever-labs-production-ec2-keypair.pem \
        -N -L 127.0.0.1:6381:master.lever-labs-production-valkey.c1qdln.use1.cache.amazonaws.com:6379 \
        ubuntu@54.81.65.153
    ;;
  *)
    echo "Usage: $0 {staging|production}"
    exit 1
    ;;
esac
