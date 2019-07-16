import logging
from pyexchange.api import PyexAPI

import time
import requests
import json

from pymaker.util import http_response_summary, bytes_to_hexstring
from typing import Optional
from pymaker.sign import eth_sign, to_vrs
from web3 import Web3


class LeverjAPI(PyexAPI):
    def __init__(self, web3: Web3, api_server: str, account_id: str, api_key: str, api_secret: str, timeout: float):
        self.web3 = web3
        self.api_server = api_server
        self.api_key = api_key
        self.api_secret = api_secret
        self.account_id = account_id
        self.timeout = timeout

    def get_account(self):
        return self._http_authenticated("GET", "/api/v1", "/account", None)

    def _http_authenticated(self, method: str, api_path: str, resource: str, body):
        data = json.dumps(body, separators=(',', ':'))
        nonce = int(time.time()*1000)
        params = {'method': method, 'uri': resource, 'nonce': nonce}
        if body is not None:
            params['body'] = body
        v, r, s = to_vrs(self._create_signature(json.dumps(params, separators=(',', ':'))))
        auth_header = f"SIGN {self.account_id}.{self.api_key}"\
            f".{v}"\
            f".{bytes_to_hexstring(r)}"\
            f".{bytes_to_hexstring(s)}"
        return self._result(requests.request(method=method,
                                             url=f"{self.api_server}{api_path}{resource}",
                                             data=data,
                                             headers={"Authorization": auth_header, "Nonce": str(nonce)},
                                             timeout=self.timeout))

    def _create_signature(self, params: str) -> str:
        return eth_sign(bytes(params, 'utf-8'), self.web3, self.api_secret)

    def _result(self, result) -> Optional[dict]:
        if not result.ok:
            raise Exception(f"Leverj API invalid HTTP response: {http_response_summary(result)}")
        try:
            data = result.json()
        except Exception:
            raise Exception(f"Leverj API invalid JSON response: {http_response_summary(result)}")
        return data
