const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sourcemaps = require('gulp-sourcemaps');
const connect = require('gulp-connect');
const jasmine = require('gulp-jasmine-livereload-task');

const sources = {
    client: {
        base: [
            'base/utils/StringUtils.js',
            'base/utils/ArrayUtils.js',
            'base/utils/Buffer.js',
            'base/utils/NumberUtils.js',
            'base/utils/BigNumber.js',
            'base/utils/Observable.js',
            'base/utils/Synchronizer.js',
            'base/utils/Timer.js',
            'base/utils/Database.js',
            'base/utils/IWorker.js',
            'base/utils/PlatformUtils.js',
            'base/crypto/Axlsign.js',
            'base/crypto/Elliptic.js',
            'base/core/common/Hash.js',
            'base/core/common/Address.js',
            'base/core/common/PublicKey.js',
            'base/core/common/Signature.js',
            'base/core/account/Wallet.js',
            'base/core/account/Account.js',
            'base/core/block/BlockBody.js',
            'base/core/block/BlockHeader.js',
            'base/core/block/BlockUtils.js',
            'base/core/block/Block.js',
            'base/core/blockchain/BaseChain.js',
            'base/core/blockchain/Blockchain.js',
            'base/core/blockchain/HeaderChain.js',
            'base/core/miner/MinerWorker.js',
            'base/core/miner/MinerWorkerImpl.js',
            'base/core/miner/MinerWorkerPool.js',
            'base/core/miner/Miner.js',
            'base/core/transaction/Transaction.js',
            'base/core/transaction/TransactionInput.js',
            'base/core/transaction/TransactionOutput.js',
            'base/core/transaction/TransactionPool.js',
            'base/core/transaction/UnspentTransactionOutput.js',
            'base/core/transaction/UnspentTransactionOutputPool.js',
            'base/network/message/Message.js',
            'base/network/message/BlocksMessage.js',
            'base/network/message/GetBlocksMessage.js',
            'base/network/message/GetHeadMessage.js',
            'base/network/message/GetPoolMessage.js',
            'base/network/message/PoolMessage.js',
            'base/network/message/MessageFactory.js',
            'base/core/consensus/GenesisConfig.js',
            'base/core/consensus/BaseConsensus.js',
            'base/core/consensus/Consensus.js',
            'base/network/DataChannel.js',
            'base/network/webrtc/WebRtcDataChannel.js',
            'base/network/network.js'
        ],
        browser: [
            'browser/crypto/Hash.js',
            'browser/crypto/Sha256.js',
            'browser/utils/Database.js',
            'browser/utils/Format.js'
        ],
        nodejs: [
            'nodejs/crypto/Hash.js',
            'nodejs/utils/Database.js'
        ]
    },
    worker: [
        'base/utils/Observable.js',
        'base/utils/Buffer.js',
        'base/utils/IWorker.js',
        'browser/crypto/Hash.js',
        'browser/crypto/Sha256.js',
        'base/core/block/BlockUtils.js',
        'base/core/miner/MinerWorker.js',
        'base/core/miner/MinerWorkerImpl.js',
        'base/core/miner/MinerWorkerPool.js'
    ],
    test: [
        'test/specs/**/*.spec.js'
    ],
    all: [
        'base/**/*.js',
        'browser/**/*.js',
        'test/**/*.js'
    ]
};

const uglify_config = {
    ie8: true,
    keep_fnames: true,
    ecma: 8,
    warnings: true,
    mangle: {
        keep_classnames: true,
        safari10: true
    },
    output: {
        safari10: true
    },
    compress: {
        sequences: false,
        typeofs: false,
        keep_infinity: true
    }
};

const BROWSER_SOURCES = [
    'browser/prefix.js',
    ...sources.client.browser,
    ...sources.client.base,
    'browser/Node.js'
];

gulp.task('build-web', ['build-worker'], () => {
    return gulp.src(BROWSER_SOURCES, { base: '.' })
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(concat('web.js'))
        .pipe(uglify(uglify_config))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'))
        .pipe(connect.reload());
});

gulp.task('build-worker', () => {
    return gulp.src(sources.worker)
        .pipe(sourcemaps.init())
        .pipe(concat('worker.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'))
        .pipe(connect.reload());
});

const NODE_SOURCES = [
    'nodejs/prefix.js',
    ...sources.client.nodejs,
    ...sources.client.base,
    'nodejs/Node.js'
];

gulp.task('build-nodejs', () => {
    return gulp.src(NODE_SOURCES)
        .pipe(sourcemaps.init())
        .pipe(concat('node.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('test', ['watch'], () => {
    gulp.run(jasmine({
        files: ['dist/web.js'].concat(sources.test)
    }));
});

gulp.task('watch', ['build-web'], () => {
    return gulp.watch(sources.all, ['build-web']);
});

gulp.task('serve', ['watch'], () => {
    connect.server({
        livereload: true
    });
});

gulp.task('build', ['build-web', 'build-nodejs']);
gulp.task('default', ['build-web', 'serve']);