<p align="center">
	<img src="https://cncf-branding.netlify.app/img/projects/helm/icon/color/helm-icon-color.svg" height="100" alt="helm logo"/>
	<img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Logo.png" height="100" alt="github logo"/>
</p>

# helm-github
![Helm3 supported](https://img.shields.io/badge/Helm%203-supported-green)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/web-seven/helm-github)


`helm-github` is a [helm](https://github.com/kubernetes/helm) plugin that allows you to manage private helm repositories on [Github Releases](https://docs.github.com/en/github/administering-a-repository/about-releases) created by [Helm Chart Releaser](https://github.com/helm/chart-releaser)

## Pre-requisites
1. Plugin require latest version of [NodeJS](https://nodejs.org/) to be installed.
1. For communication with GitHub plugin needs authentication to GitHub API using [access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token):
 -   Use a Github Access Token via system variable `export GITHUB_TOKEN={token_value}`

## Installation

Install the stable version:
```shell
$ helm plugin install https://github.com/web-seven/helm-github/releases/download/{VERSION}/plugin-nodejs.tar.gz
```

## Usage

```shell
# Add your repository to Helm
$ helm repo add repo-name github://owner/repo-name

# Update Helm cache
$ helm repo update

# Fetch the chart
$ helm fetch repo-name/chart

# Install the chart
$ helm install repo-name/chart
```

