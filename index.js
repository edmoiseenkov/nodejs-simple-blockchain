
const app = require('express')();
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const sha256 = require('sha256');

// Parsers for POST data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let newBlock = {
	previous_block_hash: 0,
	rows: [],
	timestamp: 0,
	block_hash: ''
};

let blocks = {};

let lastHash = 0;

app.post('/add_data', (req, res) => {
	newBlock.rows.push(req.body.data.toString());

	if (newBlock.rows.length === 5) {

		newBlock.timestamp = (new Date()).getTime();
		newBlock.block_hash = sha256(JSON.stringify([
			newBlock.previous_block_hash,
			newBlock.timestamp,
			newBlock.rows,
		]));

		blocks[newBlock.block_hash] = Object.assign({}, newBlock);
		lastHash = newBlock.block_hash;

		newBlock.previous_block_hash = newBlock.block_hash;
		newBlock.timestamp = 0;
		newBlock.rows = [];
		newBlock.block_hash = '';
	}

	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(blocks));
});

app.get('/last_blocks/:count', (req, res) => {
	let count = req.params.count;

	let result = [];

	for (let i = 0, _hash = lastHash; i < count; i++) {
		if (_hash === 0) {
			break;
		}

		result.push(blocks[_hash]);
		_hash = result[result.length - 1].previous_block_hash;
	}

	res.setHeader('Content-Type', 'application/json');
	res.send(result.reverse());
});

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.html'));
});

const port = process.env.PORT || '3000';
app.set('port', port);

const server = http.createServer(app);

server.listen(port, () => console.log(`API running on localhost:${port}`));