import { Uri, Event } from 'vscode';

export interface API {
    readonly state: State;
    readonly repositories: Repository[];

    // 添加这些事件定义
    readonly onDidOpenRepository: Event<Repository>;
    readonly onDidCloseRepository: Event<Repository>;

    // 添加打开仓库的方法
    openRepository(uri: Uri): Promise<Repository>;

    getRepository(uri: Uri): Repository | null;
    init(root: Uri): Promise<Repository>;
}

export interface State {
    readonly repositories: Repository[];
}

export interface Repository {
    fetch(): Promise<void>;
    readonly rootUri: Uri;
    readonly state: RepositoryState;
    getBranches(options: { remote?: boolean; pattern?: string }): Promise<Ref[]>;
}

export interface RepositoryState {
    readonly HEAD: Ref | undefined;
    readonly refs: Ref[];
    readonly remotes: Remote[];
    readonly onDidChange: Event<void>;
}

export interface Ref {
    readonly name: string;
    readonly commit: string;
    readonly remote?: string;
    readonly upstream?: { gone?: boolean };
}

export interface Remote {
    readonly name: string;
    readonly fetchUrl?: string;
    readonly pushUrl?: string;
    readonly isReadOnly: boolean;
}

export interface GitExtension {
    readonly enabled: boolean;
    readonly onDidChangeEnablement: Event<boolean>;

    activate(): Promise<void>;
    getAPI(version: number): API;
} 