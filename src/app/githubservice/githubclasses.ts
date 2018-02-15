
export class GitHubUser {
  public fullName: string;
  public login: string;
  public avatarUrl: string;
}

export abstract class GitHubNavNode {
  public nodeType = 'NODE';
}

export class GitHubRepo extends GitHubNavNode {
  public nodeType = 'REPO';
  public owner: string;
  public name: string;
  public lastFetchTime: number;

  private _isPrivate: boolean;
  private _description: string;
  private _defaultBranch: string;

  public get isPrivate(): boolean {
    return this._isPrivate;
  }
  public set isPrivate(v: boolean) {
    this._isPrivate = v;
    this.setRouterPath();
  }
  public get description(): string {
    return this._description;
  }
  public set description(v: string) {
    this._description = v;
    this.setRouterPath();
  }
  public get defaultBranch(): string {
    return this._defaultBranch;
  }
  public set defaultBranch(v: string) {
    this._defaultBranch = v;
    this.setRouterPath();
  }
  public config: object = {
    hasConfig: false,
    ignoreHiddenFiles: true,
    contentRoot: '',
    showOnlyMarkdown: false
  };

  public routerPath: string;

  private setRouterPath() {
    if (this.defaultBranch !== null) {
      this.routerPath = `/${this.owner}/${this.name}:${this.defaultBranch}`;
    }
    else {
      this.routerPath = `/${this.owner}/${this.name}`;
    }
  }
}

export class GitHubItem extends GitHubNavNode {
  public nodeType = 'ITEM';

  private _repo: GitHubRepo;
  public get repo(): GitHubRepo {
    return this._repo;
  }
  public set repo(v: GitHubRepo) {
    this._repo = v;
    this.setPaths();
  }

  private _branch: string;
  public get branch(): string {
    return this._branch;
  }
  public set branch(v: string) {
    this._branch = v;
    this.setPaths();
  }

  private _dirPath: string;
  public get dirPath(): string {
    return this._dirPath;
  }
  public set dirPath(v: string) {
    this._dirPath = v;
    this.setPaths();
  }

  private _fileName: string;
  public get fileName(): string {
    return this._fileName;
  }
  public set fileName(v: string) {
    this._fileName = v;
    this.setPaths();
  }

  public isDirectory: boolean;
  public isBinary: boolean;
  public lastGet: string;

  public routerPath: string;
  public routerPathDirOnly: string;
  public fullPath: string;

  public setPaths() {
    if (this.dirPath === undefined || this.dirPath === null || this.dirPath.length === 0) {
      this.fullPath = this.fileName;
    }
    else {
      this.fullPath = `${this.dirPath}/${this.fileName}`;
    }

    if (this.repo) {
      this.routerPathDirOnly = `/${this.repo.owner}/${this.repo.name}:${this.branch}/${this.dirPath}`;
      this.routerPath = `/${this.repo.owner}/${this.repo.name}:${this.branch}/${this.fullPath}`;
    }
  }
}

export class GitHubFile {
  public isDirty = false;
  public pristine: string = null;
  public contents: string = null;
  public item: GitHubItem = null;

  constructor(originalContents: string) {
    this.pristine = originalContents;
    this.contents = originalContents;
  }
}
