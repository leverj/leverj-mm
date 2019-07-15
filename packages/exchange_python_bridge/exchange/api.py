import json
import os
import sys
from Naked.toolshed.shell import muterun_js

api_js=os.path.join(os.path.dirname(__file__), 'api.js')


def run_js(command, arguments_as_dictionary):
  arguments_as_json = json.dumps(arguments_as_dictionary)
  node_command = f"{api_js} --command={command} --args='{arguments_as_json}'"
  response = muterun_js(node_command)
  if response.exitcode == 0:
    return json.loads(response.stdout)
  else:
    sys.stderr.write(str(response.stderr, 'utf-8'))
