from setuptools import setup, find_packages


with open('README.md') as f:
  readme = f.read()

setup(
  name='exchange',
  version='0.41.34',
  description='Python bridge for Leverj.io Spot Exchange',
  long_description=readme,
  license="MIT",
  packages=find_packages(exclude=('tests')),
  include_package_data=True,
  exclude_package_data={'': ['*.js']},

  install_requires=['Naked', 'setuptools'],
  setup_requires=['nose'],
  test_suite='nose.collector')
)

