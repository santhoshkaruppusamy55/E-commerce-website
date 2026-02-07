#!/bin/bash

# Log file for the worker
LOGFILE=/var/log/email-worker.log

# Ensure log file exists and is writable
touch $LOGFILE
chmod 666 $LOGFILE

# Load environment variables from Elastic Beanstalk
export $(/opt/elasticbeanstalk/bin/get-config environment | jq -r 'to_entries | .[] | "\(.key)=\(.value)"')

echo "Starting Email Worker at $(date)" >> $LOGFILE

# Navigate to the app directory
cd /var/app/current

# Run the worker script in the background using node
# Use nohup to keep it running after the script exits
# Redirect both stdout and stderr to the log file
nohup node src/workers/email-worker.js >> $LOGFILE 2>&1 &

PID=$!
echo "Email Worker launched with PID: $PID" >> $LOGFILE
