#!/usr/bin/env python

import json
import os
import sys
import subprocess

api_js=os.path.join(os.path.dirname(__file__), 'api.js')

def run_js(command, arguments_as_dictionary):
  arguments_as_json = json.dumps(arguments_as_dictionary)
  node_command = f"node {api_js} --command={command} --args='{arguments_as_json}'"
  completed_process = subprocess.run([node_command], stdout=subprocess.PIPE, shell=True)
  if completed_process.returncode == 0:
    return json.loads(completed_process.stdout.decode('utf-8'))
  else:
    sys.stderr.write(completed_process.stderr.decode('utf-8'))
