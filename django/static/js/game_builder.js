import {
    WebGLRenderer,
    Scene,
    Color,
    PerspectiveCamera,
    DirectionalLight,
    HemisphereLight,
    Mesh,
    MeshStandardMaterial,
    LineBasicMaterial,
    LineDashedMaterial,
    DoubleSide,
    PlaneGeometry,
    BoxGeometry,
    SphereGeometry,
    BufferGeometry,
    Line,
    Sphere,
    Box3,
    MathUtils,
    Vector3,
    AudioListener,
    AudioLoader,
    Audio
} from "./threejs/three.module.min.js";
import {TextGeometry} from "./threejs/TextGeometry.js";
import {FontLoader} from "./threejs/FontLoader.js";

export default class PongGame {
    constructor(canvas, options, players, winHandler) {
        this.canvas = canvas;
        this.options = options;
        this.players = players;
        this.winHandler = winHandler;
        this.keys = [];
        this.win = false;
        this.isGameLooped = false;
        this.isEventsInitialized = false;
        this.isAudiosInitialized = false;
        this.player1Score = 0;
        this.player2Score = 0;

        // Oyun alanını oluştur.
        this.createRender()
            .createScene()
            .createCamera(45, 0, 7, 5)
            .createLights(3, 5, 4, 4)
            .createGround(10, 5)
            .createWalls(10, 0.3, 0.1)
            .createPlayers(0.15, 0.2, 0.85, 0.05)
            .createBall(0.09, 0.06);

        // Oyun alanında ki skor görünümünü oluştur.
        this.fontLoader = new FontLoader();
        this.textMaterial = new MeshStandardMaterial({color: "white"});
        this.createScoreText();
    }

    createRender() {
        this.renderer = new WebGLRenderer({antialias: true, canvas: this.canvas});
        this.renderer.shadowMap.enabled = this.options.shadow;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        return this;
    }

    createScene() {
        this.scene = new Scene();
        this.scene.background = new Color(this.options.sceneColor);
        return this;
    }

    createCamera(fov, x, y, z) {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new PerspectiveCamera(fov, aspect, 0.1, 1000);
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
        this.scene.add(this.camera);
        return this;
    }

    createLights(intensity, x, y, z) {
        const directionalLight = new DirectionalLight("white", intensity);
        directionalLight.position.set(x, y, z);

        if (this.options.shadow) {
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
        }

        const hemisphereLight = new HemisphereLight("white", intensity);
        hemisphereLight.position.set(x, y, z);

        this.scene.add(directionalLight, hemisphereLight);
        return this;
    }

    createGround(width, height) {
        this.groundWidth = width;
        this.groundHeight = height;
        this.ground = new Mesh(
            new PlaneGeometry(width, height),
            new MeshStandardMaterial({
                color: this.options.groundColor,
                side: DoubleSide
            })
        );
        this.ground.position.set(0, -0.1, 0);
        this.ground.rotation.x = MathUtils.degToRad(90);
        this.ground.receiveShadow = this.options.shadow;

        // Center Line
        const groundHalf = height / 2;
        const points = [new Vector3(0, 0, -groundHalf), new Vector3(0, 0, groundHalf)];
        const line = new Line(
            new BufferGeometry().setFromPoints(points),
            new LineDashedMaterial({
                color: "white",
                scale: 8,
                dashSize: 1
            })
        );
        line.position.set(0, -0.095, 0);
        line.computeLineDistances();

        this.scene.add(this.ground, line);
        return this;
    }

    createWalls(width, height, depth) {
        const positionY = depth / 2;
        const positionZ = this.groundHeight / 2 + depth / 2;

        this.wallTop = new Mesh(
            new BoxGeometry(width, height, depth),
            new MeshStandardMaterial({color: "black"})
        );
        this.wallTop.position.set(0, positionY, -positionZ);
        this.wallTop.castShadow = this.options.shadow;
        this.wallTop.receiveShadow = this.options.shadow;

        this.wallBottom = this.wallTop.clone();
        this.wallBottom.position.z *= -1;

        this.wallTopBox = new Box3().setFromObject(this.wallTop);
        this.wallBottomBox = new Box3().setFromObject(this.wallBottom);

        this.scene.add(this.wallTop, this.wallBottom);
        return this;
    }

    createPlayers(width, height, depth, speed) {
        const positionX = this.groundWidth / 2 - width * 5;
        this.playerSpeed = speed;
        this.player1 = new Mesh(
            new BoxGeometry(width, height, depth),
            new MeshStandardMaterial({color: this.options.player1Color})
        );
        this.player1.position.set(-positionX, 0, 0);
        this.player1.castShadow = this.options.shadow;
        this.player1.receiveShadow = this.options.shadow;

        this.player2 = new Mesh(
            new BoxGeometry(width, height, depth),
            new MeshStandardMaterial({color: this.options.player2Color})
        );
        this.player2.position.set(positionX, 0, 0);
        this.player2.castShadow = this.options.shadow;
        this.player2.receiveShadow = this.options.shadow;

        const points = [new Vector3(0, 0, -this.groundHeight / 2), new Vector3(0, 0, this.groundHeight / 2)]
        const player1Line = new Line(
            new BufferGeometry().setFromPoints(points),
            new LineBasicMaterial({color: this.options.player1Color})
        );
        player1Line.position.set(-this.groundWidth / 2, this.ground.position.y + 0.001, 0);

        const player2Line = new Line(
            new BufferGeometry().setFromPoints(points),
            new LineBasicMaterial({color: this.options.player2Color})
        );
        player2Line.position.set(this.groundWidth / 2, this.ground.position.y + 0.001, 0);

        this.player1Box = new Box3().setFromObject(this.player1);
        this.player2Box = new Box3().setFromObject(this.player2);

        this.scene.add(this.player1, this.player2, player1Line, player2Line);
        return this;
    }

    createBall(radius, speed) {
        this.ballRadius = radius;
        this.ballSpeed = speed;
        this.randomBallVelocity()

        this.ball = new Mesh(
            new SphereGeometry(radius),
            new MeshStandardMaterial({color: this.options.ballColor})
        );
        this.ball.castShadow = this.options.shadow;
        this.ball.receiveShadow = this.options.shadow;

        this.ballSphere = new Sphere(this.ball.position, radius);

        this.scene.add(this.ball);
        return this;
    }

    randomBallVelocity() {
        const maxAngle = Math.PI / 5;
        const angle = Math.random() * maxAngle - (maxAngle / 2);
        const xDirection = Math.random() < 0.5 ? -1 : 1;
        const xSpeed = this.ballSpeed * xDirection;
        const zSpeed = this.ballSpeed * Math.sin(angle);
        this.ballVelocity = new Vector3(xSpeed, 0, zSpeed);
    }

    increaseBallSpeed() {
        // Eğer topun hızlandırması açık değilse bir şey yapma
        if (!this.options.ballAcceleration)
            return;

        // Oyun sonsuza kadar devam etmesin diye her vuruşta %2 hız artışı.
        const floatPercent = 2 / 100;
        const speedIncreaseFactor = 1 + floatPercent;
        this.ballVelocity.x *= speedIncreaseFactor;
    }

    resetBall() {
        this.ball.position.set(0, 0, 0);
        this.ballVelocity.set(0, 0, 0);
        setTimeout(() => this.randomBallVelocity(), 1500);
    }

    createScoreText() {
        this.fontLoader.load('../../static/js/threejs/helvetiker_regular.typeface.json', (font) => {
            const player1ScoreGeometry = new TextGeometry(`${this.player1Score}`, {
                font: font, size: 0.4, depth: 0
            });
            this.player1ScoreText = new Mesh(player1ScoreGeometry, this.textMaterial);
            this.player1ScoreText.position.set(-0.7, -0.09, -1.8);
            this.player1ScoreText.rotation.x = MathUtils.degToRad(-90);
            this.scene.add(this.player1ScoreText);

            const player2ScoreGeometry = new TextGeometry(`${this.player2Score}`, {
                font: font, size: 0.4, depth: 0
            });
            this.player2ScoreText = new Mesh(player2ScoreGeometry, this.textMaterial);
            this.player2ScoreText.position.set(0.36, -0.09, -1.8);
            this.player2ScoreText.rotation.x = MathUtils.degToRad(-90);
            this.scene.add(this.player2ScoreText);
        });
    }

    updateScoreText() {
        this.scene.remove(this.player1ScoreText);
        this.scene.remove(this.player2ScoreText);
        this.createScoreText();
    }

    handleResponsive() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix()

        if (!this.isGameLooped) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    handlePlayersMove() {
        if (this.keys['w'] && !this.player1Box.intersectsBox(this.wallTopBox)) {
            this.player1.position.z -= this.playerSpeed;
            this.player1Box.setFromObject(this.player1);
        }

        if (this.keys['s'] && !this.player1Box.intersectsBox(this.wallBottomBox)) {
            this.player1.position.z += this.playerSpeed;
            this.player1Box.setFromObject(this.player1);
        }

        if (this.keys['ArrowUp'] && !this.player2Box.intersectsBox(this.wallTopBox)) {
            this.player2.position.z -= this.playerSpeed;
            this.player2Box.setFromObject(this.player2);
        }

        if (this.keys['ArrowDown'] && !this.player2Box.intersectsBox(this.wallBottomBox)) {
            this.player2.position.z += this.playerSpeed;
            this.player2Box.setFromObject(this.player2);
        }
    }

    handleBallMove() {
        this.ball.position.add(this.ballVelocity);

        // Player 1 Score
        if (this.ball.position.x - this.ballRadius > this.groundWidth / 2) {
            this.playAudio(this.scoreAudio);

            this.player1Score++;
            this.updateScoreText();

            this.resetBall();

            if (this.player1Score === 3) {
                this.win = true;
                this.stop();
                this.stopAllAudio();
                this.winHandler(this.players[0]);
                return;
            }
        }

        // Player 2 Score
        if (this.ball.position.x + this.ballRadius < -this.groundWidth / 2) {
            this.playAudio(this.scoreAudio);

            this.player2Score++;
            this.updateScoreText();

            this.resetBall();

            if (this.player2Score === 3) {
                this.win = true;
                this.stop();
                this.stopAllAudio();
                this.winHandler(this.players[1]);
                return;
            }
        }

        // Üst Duvar kontrolü
        if (this.ballSphere.intersectsBox(this.wallTopBox)) {
            // Duvar sesi oynat
            this.playAudio(this.wallHitAudio);

            // Topun yönünü tersine çevirir.
            this.ballVelocity.z = -this.ballVelocity.z;

            // Topun duvar içinde kalmamasını garanti et, güvenlik önlemi.
            this.ball.position.z = this.wallTopBox.max.z + this.ballRadius;
        }

        // Alt Duvar kontrolü
        if (this.ballSphere.intersectsBox(this.wallBottomBox)) {
            // Duvar sesi oynat
            this.playAudio(this.wallHitAudio);

            // Topun yönünü tersine çevirir.
            this.ballVelocity.z = -this.ballVelocity.z;

            // Topun duvar içinde kalmamasını garanti et, güvenlik önlemi.
            this.ball.position.z = this.wallBottomBox.min.z - this.ballRadius;
        }

        // Player 1 kontrolü
        if (this.ballSphere.intersectsBox(this.player1Box)) {
            // Paddle sesi oynat
            this.playAudio(this.paddleHitAudio);

            // Topun hızlanması açıksa zamanla hızlanacak
            this.increaseBallSpeed();

            // Topun paddle'ın merkeze göre neresine vurduğunu belirler.
            // - değer yukarıya + değer ise aşağıya vurduğunu gösterir.
            const hitPoint = this.ball.position.z - this.player1.position.z;

            // Paddle'ın yarısı, üst taraf veya alt taraf olacak.
            const halfSize = this.player1.geometry.parameters.depth / 2;

            // Topun yukarı veya aşağı vurduğunu bilmek doğru açı için yeterli değil.
            // Topum yukarıda veya aşağıda hangi noktaya vurduğunu bulup ona göre açı vermemiz gerekiyor.
            // Bu nedenle vurduğu noktayı vurduğu tarafın (aşağı veya yukarı) boyutuna bölerek buluruz.
            const normalizedHitPoint = hitPoint / halfSize;

            // normalizedHitPoint değeri -1 ile 1 arasında olacağından,
            // bu değeri maksimum açı olan 45 derece (Math.PI / 4) ile çarparak bounceAngle hesaplarız.
            // 45 derece olmasının nedeni oynanabilirlik açısından güzel olması ve tavsiye edilmesidir.
            // Böylelikle top paddle'a çarptığı noktaya göre en fazla 45 derece açıda geri dönebilir.
            const bounceAngle = normalizedHitPoint * (Math.PI / 4);

            // Player 1 için top x (yatay) düzlemde her zaman sağa gitmelidir.
            // Düz giderken % 20 hızlandıralım.
            this.ballVelocity.x = Math.abs(this.ballVelocity.x);

            // Z yani dikey düzlemde ise açıya göre hareket etmelidir.
            this.ballVelocity.z = Math.sin(bounceAngle) * Math.abs(this.ballVelocity.x);
        }

        // Player 2 kontrolü
        if (this.ballSphere.intersectsBox(this.player2Box)) {
            // Paddle sesi oynat
            this.playAudio(this.paddleHitAudio);

            // Topun hızlanması açıksa zamanla hızlanacak
            this.increaseBallSpeed();

            // Topun paddle'ın merkeze göre neresine vurduğunu belirler.
            // - değer yukarıya + değer ise aşağıya vurduğunu gösterir.
            const hitPoint = this.ball.position.z - this.player2.position.z;

            // Paddle'ın yarısı, üst taraf veya alt taraf olacak.
            const halfSize = this.player2.geometry.parameters.depth / 2;

            // Topun yukarı veya aşağı vurduğunu bilmek doğru açı için yeterli değil.
            // Topum yukarıda veya aşağıda hangi noktaya vurduğunu bulup ona göre açı vermemiz gerekiyor.
            // Bu nedenle vurduğu noktayı vurduğu tarafın (aşağı veya yukarı) boyutuna bölerek buluruz.
            const normalizedHitPoint = hitPoint / halfSize;

            // normalizedHitPoint değeri -1 ile 1 arasında olacağından,
            // bu değeri maksimum açı olan 45 derece (Math.PI / 4) ile çarparak bounceAngle hesaplarız.
            // 45 derece olmasının nedeni oynanabilirlik açısından güzel olması ve tavsiye edilmesidir.
            // Böylelikle top paddle'a çarptığı noktaya göre en fazla 45 derece açıda geri dönebilir.
            const bounceAngle = normalizedHitPoint * (Math.PI / 4);

            // Player 2 için top x (yatay) düzlemde her zaman sola gitmelidir.
            this.ballVelocity.x = -Math.abs(this.ballVelocity.x);

            // Z yani dikey düzlemde ise açıya göre hareket etmelidir.
            this.ballVelocity.z = Math.sin(bounceAngle) * Math.abs(this.ballVelocity.x);
        }

    }

    playAudio(audio) {
        // Eğer sound açık değilse bir şey yapma
        if (!this.options.sound)
            return;

        if (audio.isPlaying) {
            audio.stop();
        }
        audio.play();
    }

    stopAllAudio() {
        if (this.paddleHitAudio.isPlaying)
            this.paddleHitAudio.stop();

        if (this.wallHitAudio.isPlaying)
            this.wallHitAudio.stop();

        if (this.scoreAudio.isPlaying)
            this.scoreAudio.stop();
    }

    initializeAudio() {
        const audioListener = new AudioListener();
        const audioLoader = new AudioLoader();
        this.wallHitAudio = new Audio(audioListener);
        this.paddleHitAudio = new Audio(audioListener);
        this.scoreAudio = new Audio(audioListener)

        audioLoader.load('../../static/audio/wall_hit.mp3', (buffer) => {
            this.wallHitAudio.setBuffer(buffer);
            this.wallHitAudio.setVolume(0.8);
        });

        audioLoader.load('../../static/audio/paddle_hit.mp3', (buffer) => {
            this.paddleHitAudio.setBuffer(buffer);
            this.paddleHitAudio.setVolume(0.3);
        });

        audioLoader.load('../../static/audio/score.mp3', (buffer) => {
            this.scoreAudio.setBuffer(buffer);
            this.scoreAudio.setVolume(0.3);
        });

        this.camera.add(audioListener);
        this.isAudiosInitialized = true;
    }

    initializeEvents() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.key] = true;

            if (this.keys['p'] && this.isGameLooped && !this.win)
                this.stop();

            if (this.keys['o'] && !this.isGameLooped && !this.win)
                this.start();
        });
        document.addEventListener('keyup', (event) => this.keys[event.key] = false);
        window.addEventListener('resize', () => this.handleResponsive());
        this.isEventsInitialized = true;
    }

    initializeGameLoop() {
        this.renderer.setAnimationLoop(() => {
            this.handleBallMove();
            this.handlePlayersMove();
            this.renderer.render(this.scene, this.camera);
        })
        this.isGameLooped = true;
    }

    start() {
        if (!this.isAudiosInitialized) {
            this.initializeAudio();
        }

        if (!this.isEventsInitialized) {
            this.initializeEvents();
        }

        if (!this.isGameLooped) {
            this.initializeGameLoop();
        }
    }

    stop() {
        if (this.isGameLooped) {
            this.renderer.setAnimationLoop(null);
            this.isGameLooped = false;
        }
    }
}
