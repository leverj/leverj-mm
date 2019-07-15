from setuptools import setup, find_packages


with open("README.md") as f:
  readme = f.read()

with open("package.json") as f:
  package_json = f.read()

# package_json = {
#   "dependencies": {
#     "@leverj/adapter": "0.1.22",
#     "dashdash": "^1.14.1"
#   }
# }

setup(
  name="leverj_spot_exchange_bridge",
#   version="0.1.22",
  version="0.0.1",
  description="Python bridge for Leverj.io Spot Exchange",
  long_description=readme,
  long_description_content_type="text/markdown",
  author="https://github.com/leverj/leverj-mm/leverj_spot_exchange_bridge",
  url="https://leverj.io/",
  license="MIT",
  packages=find_packages(exclude=("tests")),
  classifiers=[
    "Programming Language :: Python :: 3",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
  ],
  install_requires=["Naked", "setuptools"],
  setup_requires=["calmjs", "nose"],
  extras_require={
    "dev": ["calmjs", "nose"],
  },
  package_json=package_json,
  test_suite="nose.collector")

