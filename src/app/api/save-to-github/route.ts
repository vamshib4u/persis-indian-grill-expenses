import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sales, transactions, month, year } = await request.json();
    
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO;
    const githubBranch = process.env.GITHUB_BRANCH || 'data';

    if (!githubToken || !githubRepo) {
      return NextResponse.json(
        { 
          error: 'GitHub not configured. Set GITHUB_TOKEN and GITHUB_REPO in .env.local',
          instructions: 'Visit: https://github.com/settings/tokens to create a Personal Access Token with "repo" and "workflow" permissions'
        },
        { status: 400 }
      );
    }

    const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
    const filename = `data/${year}-${String(month + 1).padStart(2, '0')}-${monthName}.json`;
    
    const dataToSave = {
      month: monthName,
      year,
      exportedAt: new Date().toISOString(),
      sales,
      transactions,
    };

    const content = JSON.stringify(dataToSave, null, 2);
    const encodedContent = Buffer.from(content).toString('base64');

    // First, try to get the existing file (to get its SHA)
    let sha: string | null = null;

    try {
      const getFileResponse = await fetch(
        `https://api.github.com/repos/${githubRepo}/contents/${filename}?ref=${githubBranch}`,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      if (getFileResponse.ok) {
        const fileData = await getFileResponse.json();
        sha = fileData.sha;
      }
    } catch {
      // File doesn't exist yet, that's okay
    }

    // Create or update the file
    const putFileResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/${filename}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update ${monthName} data`,
          content: encodedContent,
          branch: githubBranch,
          ...(sha && { sha }),
        }),
      }
    );

    if (!putFileResponse.ok) {
      const error = await putFileResponse.text();
      console.error('GitHub API error:', error);
      throw new Error(`Failed to save to GitHub: ${putFileResponse.statusText}`);
    }

    const result = await putFileResponse.json();

    return NextResponse.json({
      success: true,
      message: `Data saved to GitHub: ${filename}`,
      githubUrl: `https://github.com/${githubRepo}/blob/${githubBranch}/${filename}`,
      file: result.content,
    });
  } catch (error) {
    console.error('Save to GitHub error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
