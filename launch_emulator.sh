#!/bin/bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator

echo "Starting Android Emulator..."
$ANDROID_HOME/emulator/emulator -avd Medium_Phone_API_36.1 -no-snapshot-load -no-snapshot-save
