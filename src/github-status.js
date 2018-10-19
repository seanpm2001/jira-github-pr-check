// © 2016 and later: Unicode, Inc. and others.
// License & terms of use: http://www.unicode.org/copyright.html#License

"use strict";

const octokitRest = require("@octokit/rest");

async function getAuthenticatedOctokitClient() {
	if (process.env.GITHUB_TOKEN) {
		const client = octokitRest();
		client.authenticate({
			type: "token",
			token: process.env.GITHUB_TOKEN
		});
		return client;
	} else if (process.env.GITHUB_APP_ID) {
		const token = await require("./github-token").getNewToken();
		const client = octokitRest();
		client.authenticate({
			type: "token",
			token
		});
		return client;
	}
}

async function createStatus(pullRequest, pass, targetUrl, description) {
	// TODO: Is it possible that pullRequest.base is different from the repository hosting the pull request?
	const owner = pullRequest.base.repo.owner.login;
	const repo = pullRequest.base.repo.name;
	const sha = pullRequest.head.sha;
	const state = pass ? "success" : "failure";
	console.log("Setting Status:", owner + "/" + repo, sha, "\"" + description + "\"");
	const data = {
		owner,
		repo,
		sha,
		state: state,
		target_url: targetUrl,
		description,
		context: "jira-ticket"
	};
	const client = await getAuthenticatedOctokitClient();
	await client.repos.createStatus(data);
}

async function getPullRequest(params) {
	// params should have keys {owner, repo, number}
	const client = await getAuthenticatedOctokitClient();
	const pullRequest = await client.pullRequests.get(params);
	return pullRequest.data;
}

async function getCommits(params) {
	// params should have keys {owner, repo, number}
	const client = await getAuthenticatedOctokitClient();
	// Get max commits per page (100)
	const newParams = Object.assign({
		per_page: 100
	}, params);
	const commitsResult = await client.pullRequests.getCommits(newParams);
	return commitsResult.data;
}

module.exports = {
	createStatus,
	getPullRequest,
	getCommits
};
