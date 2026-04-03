// src/github-prs/github-prs.tsx
import { css, styled } from "uebersicht";
var CONFIG_PATH = "$HOME/.config/ubersicht/github-prs.json";
var GH_FIELDS = "number,title,state,isDraft,author,reviewDecision,additions,deletions,createdAt,updatedAt,headRefName,url,reviewRequests,assignees,labels,comments,statusCheckRollup";
var command = `cat ${CONFIG_PATH} | /usr/bin/python3 -c "import sys,json; repos=json.load(sys.stdin)['repos']; print('\\n'.join(repos))" | while read repo; do echo "---REPO:$repo---"; /opt/homebrew/bin/gh pr list --repo "$repo" --author "@me" --json ${GH_FIELDS} --limit 20; done`;
var refreshFrequency = 6e4;
function parsePRs(output) {
  if (!output || output.trim() === "") return [];
  const prs = [];
  const repoSections = output.split("---REPO:");
  for (const section of repoSections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    const endMarker = trimmed.indexOf("---");
    if (endMarker === -1) continue;
    const repo = trimmed.slice(0, endMarker);
    const json = trimmed.slice(endMarker + 3).trim();
    if (!json || json === "[]") continue;
    try {
      const parsed = JSON.parse(json);
      parsed.forEach((pr) => prs.push({ ...pr, repo }));
    } catch {
    }
  }
  prs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return prs;
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 6e4);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}
function reviewColor(decision, isDraft) {
  if (isDraft) return "#6e7681";
  switch (decision) {
    case "APPROVED":
      return "#3fb950";
    case "CHANGES_REQUESTED":
      return "#f85149";
    case "REVIEW_REQUIRED":
      return "#d29922";
    default:
      return "#8b949e";
  }
}
function reviewLabel(decision, isDraft) {
  if (isDraft) return "DRAFT";
  switch (decision) {
    case "APPROVED":
      return "APPROVED";
    case "CHANGES_REQUESTED":
      return "CHANGES REQ";
    case "REVIEW_REQUIRED":
      return "REVIEW REQ";
    default:
      return "PENDING";
  }
}
function ciStatus(checks) {
  if (!checks || checks.length === 0) return { label: "\u2014", color: "#8b949e" };
  const failed = checks.some((c) => c.conclusion === "FAILURE" || c.conclusion === "TIMED_OUT");
  if (failed) return { label: "FAIL", color: "#f85149" };
  const pending = checks.some((c) => c.status === "IN_PROGRESS" || c.status === "QUEUED" || c.status === "PENDING");
  if (pending) return { label: "RUNNING", color: "#d29922" };
  return { label: "PASS", color: "#3fb950" };
}
function repoShort(repo) {
  const parts = repo.split("/");
  return parts[parts.length - 1];
}
var className = css`
  position: fixed;
  top: 20px;
  left: 20px;
  font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
  font-size: 16px;
  color: #e6edf3;
  user-select: none;
  z-index: 1;
`;
var Wrapper = styled.div`
  background: rgba(13, 17, 23, 0.88);
  border: 1px solid rgba(48, 54, 61, 0.6);
  border-radius: 10px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  min-width: 1519px;
  max-width: 1700px;
  overflow: hidden;
`;
var Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(48, 54, 61, 0.4);
`;
var Title = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #f0f6fc;
`;
var Dot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3fb950;
  display: inline-block;
`;
var Stats = styled.div`
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #8b949e;
`;
var StatVal = styled.span`
  color: #e6edf3;
  font-weight: 600;
`;
var Table = styled.div`
  display: grid;
  grid-template-columns: 3fr auto 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 0 12px;
  padding: 0 20px;
`;
var Columns = styled.div`
  display: contents;
  & > span {
    padding: 8px 0;
    font-size: 13px;
    color: #8b949e;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    border-bottom: 1px solid rgba(48, 54, 61, 0.25);
  }
`;
var Row = styled.div`
  display: contents;
  & > * {
    padding: 10px 0;
    border-bottom: 1px solid rgba(48, 54, 61, 0.18);
    transition: background 0.15s;
  }
`;
var StatusBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: ${(p) => p.bg};
`;
var StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.bg};
  flex-shrink: 0;
`;
var PRTitle = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #8b949e;
  font-size: 14px;
`;
var PRMeta = styled.div`
  font-size: 13px;
  color: #8b949e;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
var Link = styled.a`
  color: inherit;
  text-decoration: none;
  cursor: pointer !important;
  pointer-events: auto;
  &:hover {
    text-decoration: underline;
  }
`;
var Diff = styled.div`
  display: flex;
  gap: 8px;
  font-size: 14px;
`;
var Added = styled.span`
  color: #3fb950;
`;
var Removed = styled.span`
  color: #f85149;
`;
var Author = styled.div`
  font-size: 14px;
  color: #8b949e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
var CI = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.color};
`;
var Comments = styled.div`
  font-size: 14px;
  color: #8b949e;
`;
var Age = styled.div`
  font-size: 14px;
  color: #8b949e;
`;
var RepoHeading = styled.div`
  padding: 10px 20px 6px;
  font-size: 13px;
  font-weight: 600;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-top: 1px solid rgba(48, 54, 61, 0.4);

  &:first-child {
    border-top: none;
  }
`;
var Empty = styled.div`
  padding: 32px 20px;
  text-align: center;
  color: #484f58;
  font-size: 16px;
`;
var ErrorBox = styled.div`
  padding: 14px 20px;
  color: #f85149;
  font-size: 14px;
  white-space: pre-wrap;
`;
var ConfigMessage = styled.div`
  padding: 24px 20px;
  color: #8b949e;
  font-size: 14px;
  line-height: 1.6;
`;
var CodeBlock = styled.pre`
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  color: #e6edf3;
  font-size: 13px;
  line-height: 1.5;
`;
var render = ({
  output,
  error
}) => {
  const errorStr = error ? String(error) : "";
  const configMissing = errorStr.includes("github-prs.json");
  const ghMissing = errorStr.includes("gh: command not found") || errorStr.includes("gh: No such file");
  if (configMissing || ghMissing) {
    return <Wrapper>
        <Header>
          <Title>
            <Dot />
            Pull Requests
          </Title>
        </Header>
        {configMissing && <ConfigMessage>
            Create configuration file: ~/.config/ubersicht/github-prs.json
            <CodeBlock>{`{
  "repos": ["owner/repo-one", "owner/repo-two"]
}`}</CodeBlock>
          </ConfigMessage>}
        {ghMissing && <ConfigMessage>
            GitHub CLI (gh) not found. Install it with Homebrew:
            <CodeBlock>brew install gh</CodeBlock>
          </ConfigMessage>}
      </Wrapper>;
  }
  const prs = parsePRs(output ?? "");
  const repoCount = new Set(prs.map((p) => p.repo)).size;
  const grouped = {};
  for (const pr of prs) {
    if (!grouped[pr.repo]) grouped[pr.repo] = [];
    grouped[pr.repo].push(pr);
  }
  const sortedGroups = Object.entries(grouped).sort(
    ([, a], [, b]) => new Date(b[0].updatedAt).getTime() - new Date(a[0].updatedAt).getTime()
  );
  return <Wrapper>
      <Header>
        <Title>
          <Dot />
          Pull Requests
        </Title>
        <Stats>
          <span>
            PRS: <StatVal>{prs.length}</StatVal>
          </span>
          <span>
            REPOS: <StatVal>{repoCount}</StatVal>
          </span>
        </Stats>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      {prs.length > 0 ? <div>
          {sortedGroups.map(([repo, repoPrs]) => <div key={repo}>
              <RepoHeading>{repoShort(repo)}</RepoHeading>
              <Table>
                <Columns>
                  <span>NAME</span>
                  <span>REF</span>
                  <span>BRANCH</span>
                  <span>AUTHOR</span>
                  <span>CI</span>
                  <span>DIFF</span>
                  <span>COMMENTS</span>
                  <span>AGE</span>
                  <span style={{ textAlign: "right" }}>STATUS</span>
                </Columns>
                {repoPrs.map((pr) => {
    const color = reviewColor(pr.reviewDecision, pr.isDraft);
    return <Row key={`${pr.repo}-${pr.number}`}>
                      <PRTitle><Link href={pr.url}>{pr.title}</Link></PRTitle>
                      <PRMeta><Link href={pr.url}>#{pr.number}</Link></PRMeta>
                      <PRMeta><Link href={`https://github.com/${pr.repo}/tree/${pr.headRefName}`}>{pr.headRefName}</Link></PRMeta>
                      <Author><Link href={`https://github.com/${pr.author.login}`}>{pr.author.login}</Link></Author>
                      <CI color={ciStatus(pr.statusCheckRollup).color}>
                        {ciStatus(pr.statusCheckRollup).label}
                      </CI>
                      <Diff>
                        <Added>+{pr.additions}</Added>
                        <Removed>-{pr.deletions}</Removed>
                      </Diff>
                      <Comments>{pr.comments ? pr.comments.length : 0}</Comments>
                      <Age>{timeAgo(pr.createdAt)}</Age>
                      <StatusBadge bg={color}>
                        {reviewLabel(pr.reviewDecision, pr.isDraft)}
                      </StatusBadge>
                    </Row>;
  })}
              </Table>
            </div>)}
        </div> : !error && <Empty>No open pull requests</Empty>}
    </Wrapper>;
};
export {
  className,
  command,
  refreshFrequency,
  render
};
