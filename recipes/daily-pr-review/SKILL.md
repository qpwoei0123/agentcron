---
name: daily-pr-review
description: "Review open PRs and summarize status"
schedule: "0 9 * * 1-5"
---

Review all open pull requests in this repository.
For each PR, summarize: title, author, days open, review status.
Flag any PR older than 3 days without review.
Output a markdown table.
