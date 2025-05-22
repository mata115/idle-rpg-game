import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	const provider = new GameViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(GameViewProvider.viewType, provider));

	context.subscriptions.push(
		vscode.commands.registerCommand('idleGame.addColor', () => {
			provider.addColor();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('idleGame.clearColors', () => {
			provider.clearColors();
		}));
}

class GameViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'idleGame.gameView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'colorSelected':
					{
						vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
						break;
					}
			}
		});
	}

	public addColor() {
		if (this._view) {
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.postMessage({ type: 'addColor' });
		}
	}

	public clearColors() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'clearColors' });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		//const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		//const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		//const nonce = getNonce();

		return `<!DOCTYPE html>
					<html lang="ja">
					<head>
					<meta charset="UTF-8">
					<title>Idle RPG</title>
					<link href="${styleMainUri}" rel="stylesheet">
					</head>
					<body>
					<div class="container">
						<h1>🧍 プレイヤー</h1>
						<ul>
						<li>HP: <span id="player-hp">100 / 100</span></li>
						<li>攻撃力: <span id="player-attack">-</span></li>
						<li>防御力: <span id="player-defense">-</span></li>
						<li>コイン: <span id="player-coins">-</span> g</li>
						</ul>

						<h1>🧟 敵</h1>
						<ul>
						<li>名前: <span id="enemy-name">-</span></li>
						<li>レベル: <span id="enemy-level">1</span></li>
						<li>HP: <span id="enemy-hp">-</span></li>
						<li>攻撃力: <span id="enemy-attack">-</span></li>
						<li>防御力: <span id="enemy-defense">-</span></li>
						<li>会心率: <span id="enemy-crit">-</span></li>
						</ul>

						<h2>💥 バトルログ</h2>
						<div id="battle-log">
						<p>戦闘はまだ始まっていません。</p>
						</div>

						<h2>🛠 強化 <span id="upgrade-cost">(次の強化コスト: 50g)</span></h2>
						<button id="upgrade-weapon">武器強化</button>
						<button id="upgrade-armor">防具強化</button>
					</div>
					<script src="${scriptUri}"></script>
					</body>
					</html>`;
	}
}
