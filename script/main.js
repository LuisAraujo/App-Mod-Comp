var  OFFSET_LAT = null;
var OFFSET_LOG = null;

//canvas
var canvas;
//contexto 2d
var ctx
//Mapa gerado pelo Dijkstras
var GraphMain;
//offset para posicionar o grafico de acordo como a posicao do GPS
var offsetX,offsetY;

var zoom;

var imgPonto, imgLocal;

var ready = [];
ready[0] =false;
ready[1] = false;

var yourGPSposition;
var yourDistiny = 7;

//limites máximos e minimos para buscar buracos em uma area
var limiteMax = [];
limiteMax[0] = -Infinity;
limiteMax[1] = -Infinity;
var limiteMin = [];
limiteMin[0] = Infinity;
limiteMin[1] = Infinity;



//CARREGA AS IMAGENS (RECURSOS)
function loadSources(){
    imgLocal = new Image();
    imgLocal.onload = function(){
        ready[0] = true;

    };
    imgPonto = new Image();
    imgPonto.onload = function(){
        ready[1] = true;
    };
    imgLocal.src = 'imagens/local.png';
    imgPonto.src = 'imagens/ponto.png';

}

//READY :)
$(document).ready(function(){
    //carrega as imagens
    loadSources();
    //inicia o mecanismo de load
    loadingApp();


});

//VERIFICA SE OS RECURSOS FORAM CARREGADOS
//caso contrario se chama apos 100 milisegundo
function loadingApp(){
    if(ready[0] != false && ready[1] != false){
        startApp();
    }else{
        setTimeout(function(){loadingApp()}, 100);
    }
}

//INICIA O APP
//depois dos recursos carregados
function startApp(){
    //inicializa o Canvas
    startCanvas();

    //Constroi a arvores (será preciso passar a posicao do GPS para consulda no banco e aquisicao de uma range especifico de ruas
    buildGraph();

    //desenha os caminhos após a construção da arvores (fazer forma síncrona)
    drawPaths();

    //essa função busca o nó mais proximo da sua localização (passada em GPS)
    //yourGPSposition = getNodeAroundTo(-12.956681, -38.495340);
    yourGPSposition = getNodeAroundTo(  -12.202247, -38.975395);

    //teste para obter o melhor caminho
    getLessWay(yourGPSposition, yourDistiny);


    //Botões de interacao
    $("#zoom_out").click(function(){

        oldX =  offsetX*(zoom/100);
        difX= oldX - offsetX;

        zoom+=1;
        offsetX =  offsetX*(zoom/100);
        offsetX + difX;

        oldY =  offsetY*(zoom/100);
        difY= oldY - offsetY;


        offsetY =  offsetY*(zoom/100);
        difY= oldY - offsetY;

        clearCanvas();

        drawPaths();
        getLessWay(yourGPSposition, yourDistiny);


    });

    $("#zoom_in").click(function(){

        oldX =  200*(zoom/100);
        difX= oldX - offsetX;

        zoom-=1;

        offsetX =  offsetX*(zoom/100);
        offsetX + difX;

        oldY =  650*(zoom/100);
        difY= oldY - offsetY;


        offsetY =  offsetY*(zoom/100);
        offsetY + difY;

        clearCanvas();
        clearCanvas();
        drawPaths();
        getLessWay(yourGPSposition, yourDistiny);
    });

}


function changeOffSet(axis, operation, value){
    if(axis == "x"){
            if(operation == "+")
                offsetX+=value;
            else if(operation == "-")
                offsetX-=value;
    }else if(axis == "y"){
        if(operation == "+")
            offsetY+=value;
        else if(operation == "-")
            offsetY-=value;
    }

    clearCanvas();
    drawPaths();
    getLessWay(yourGPSposition, yourDistiny);

 }

//INICIA O CANVAS
function startCanvas(){
    //pega o canvas
    canvas = document.getElementById("myCanvas");
    //pega o contexto
    ctx = canvas.getContext("2d");

    //zoom inicial
    zoom = 100;
    //offset para o canvas
    offsetX = 200;
    offsetX =  offsetX*(zoom/100);

    //offset para o canvas
    offsetY = 650;
    offsetY = offsetY*(zoom/100);

    clearCanvas();



}

//LIMPA CANVAS
function clearCanvas(){
    //pinta o canvas de cinza
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#eaeaea";
    ctx.fill();
}


//DESENHA OS PONTOS (inicial e final)
function drawPoint(x, y, mode){
    image = null;
    if(mode == "start")
        image = imgLocal;
    else if(mode == "end")
        image = imgPonto;

    ctx.drawImage(image, x-(image.width/2) , y-image.height);

};


//DESENHA OS CAMINHOS DO GRAFO

//ao pecorrer todos os nos podemos quardar os limites maximos e minimos para
//a busca de buracos na area
function drawPaths(){

	g = GraphMain.graph;

    var array = Object.keys(g).map(function (key) {return g[key]});

    //percorrer todos os arrays do grafico
    for(i=0; i< array.length; i++){

        //pega a posicao inicial do ponto
        cord = convertCordToPoint(  array[i]["Lat"],  array[i]["Log"]);
        latStart =  cord[0];
        logStart =  cord[1];

        //calcula pontos Latitude e Longitude Máxima e Minima
        calcMaxAndMinCord(array[i]);

        c=0;

        for(var a in array[i]){
            c++;
            if(a!="Log" && a!="Lat"){
                cord = convertCordToPoint( g[a]["Lat"],  g[a]["Log"]);
                latEnd = cord[0];
                logEnd = cord[1];

                ctx.beginPath();
                ctx.strokeStyle = "#fff";

                //ctx.moveTo( (latStart * -zoom)  +offsetX, (logStart * -zoom) + offsetY);
                //ctx.lineTo( (latEnd  * -zoom) + offsetX, (logEnd  * -zoom)  +offsetY);

                ctx.moveTo(logStart, latStart);
                ctx.lineTo(logEnd , latEnd );

                ctx.lineWidth = 5;
                ctx.stroke();

            }
        }
    }
};


//calcula a cordenada minima e maxima para obter os buracos nessa area
function calcMaxAndMinCord(c){
    if(latStart > limiteMax[0])
        limiteMax[0] = c["Lat"];
    if(logStart > limiteMax[1])
        limiteMax[1] = c["Log"];
    if(latStart < limiteMin[0])
        limiteMin[0] = c["Lat"];
    if(logStart < limiteMin[1])
        limiteMin[1] = c["Log"];

}
//DESENHA O CAMINHO ENCONTRADO
//param é retorno do GraphMain.getPath(A,B)
function drawFoundPaths(param){

    //obtem o mapa
    g = GraphMain.graph;

    //ponto de inicio
    start = param[0];
    //caminho do 1 ponto após a origem ao final pelo melhor caminho (array de index: 1,2,5,6).
    path = param[1];

    //lat e log da posicao inicial
    cord = convertCordToPoint( start[1],  start[2]);
    latStart =  cord[0];
    logStart =  cord[1];


    //percorrer todos os arrays do gráfico
    for(i=0; i< path.length; i++){

        //quando i é 0 não há nó anterior, então pegue a origem! Em caso de ser maior que 0, pega o anterior
        if(i>0){
            //path[i-1] é o index do ponto anterior
            cord = convertCordToPoint( g[path[i-1]]["Lat"],  g[path[i-1]]["Log"]);
            latStart = cord[0];
            logStart = cord[1];

        }
        //ponto atual index = path[i]
        cord = convertCordToPoint( g[path[i]]["Lat"],  g[path[i]]["Log"]);
        latEnd = cord[0];
        logEnd = cord[1];

        ctx.beginPath();
        ctx.strokeStyle = "#00f";
        //ctx.moveTo((latStart * -zoom)  +offsetX, (logStart * -zoom) + offsetY);
        //ctx.lineTo((latEnd  * -zoom) + offsetX , (logEnd  * -zoom)  +offsetY);

        ctx.moveTo(logStart, latStart);
        ctx.lineTo( logEnd, latEnd);

        ctx.lineWidth = 1;
        ctx.stroke();



    }
};



//CRIA O GRAFO COM OS NÓS
function buildGraph(){
    
	GraphMain = new Dijkstras();

    //CRIANDO OS PONTOS COM O GPS
   //validando no GMaps https://www.google.com.br/maps/@-12.9582975,-38.4943758,18.5z
   a = [
        ["1", -12.957410, -38.493494, []],
        ["2", -12.957237, -38.494063, []],
        ["3", -12.959018, -38.494131, []],
        ["4", -12.958778, -38.494677,[]],
        ["5", -12.957007, -38.495224,[]],
        ["6", -12.958216, -38.494806,[]],
        ["7", -12.959179, -38.495182,[]],
        ["8", -12.959541, -38.494343, []]

    ]

    //CRIANDO OS CAMINHOS ENTRE OS PONTOS
    //o valor do caminho inicialmente é 0, o calculo é feito com a distancia dos pontos
    a[0][3] = [ ["2", 0], ["3", 0] ];
    a[1][3] = [["1", 0], ["5", 0],["4", 0] ];
    a[2][3] = [["1", 0], ["4", 0], ["8", 0]];
    a[3][3] = [["3", 0], ["2", 0]];
    a[4][3] = [["2", 0], ["6", 0]];
    a[5][3] = [["5", 0], ["7", 0]];
    a[6][3] = [["6", 0], ["8", 0]];
    a[7][3] = [["7", 0], ["3", 0]];


    //TESTE SEGUNDO MAPA
    fe = [
        ["1", -12.202247, -38.975395, []],
        ["2", -12.200789, -38.975878, []],
        ["3", -12.200170, -38.974065, []],
        ["4", -12.198797, -38.974537,[]],
        ["5", -12.198083, -38.972445,[]],
        ["6", -12.199478, -38.971972,[]],
        ["7", -12.201030, -38.971522,[]]
    ];

    fe[0][3] = [["2", 0], ["7", 0]];
    fe[1][3] = [["1", 0], ["3", 0]];
    fe[2][3] = [["2", 0], ["4", 0], ["6", 0]];
    fe[3][3] = [["3", 0], ["5", 0]];
    fe[4][3] = [["4", 0], ["6", 0]];
    fe[5][3] = [["5", 0], ["3", 0]];
    fe[6][3] = [["1", 0]];

    a = fe;

    //CRIANDO ARRAY COMO INDEX, pegando a posicao 0 das subarray de a.
    //Isso permite consultar os valores passando o index dos caminhos
    b =[];
    for(i=0; i< a.length; i++){
        b[a[i][0]] = [a[i][1],a[i][2]];
    }

    //CALCULANDO O VALOR DO CAMINHO
    //Esse loop percorre os nós de a e calcula a distancia para casa subarray (caminhos)
    for(i=0; i< a.length;i++){
        for(j=0; j< a[i][3].length; j++){

            //criando os caminhos
            end = a[i][3][j][0];
            sub_array = [];
            //disLatLong fornece a distancia em Km
            dist = distLatLong( a[i][1], a[i][2], b[end][0], b[end][1]);
            //coloca o valor da distância
            a[i][3][j][1] = dist;
        }
    }

    //passa o array "a" como parametro para criar o Grarfo;
    GraphMain.setGraph(a);

}

//OBTEM O MENOS CAMINHO PARA SAIR DO START E CHEGAR AO END
function getLessWay(start, end){
   g = GraphMain.graph;

   cord = convertCordToPoint( g[start]["Lat"], g[start]["Log"] );
   latStart = cord[0];
   logStart = cord[1];

    cord = convertCordToPoint( g[end]["Lat"], g[end]["Log"] );
    latEnd = cord[0];
    logEnd = cord[1];

    drawPoint(logStart, latStart,  "start");
    drawPoint(logEnd, latEnd ,  "end");

   //retorna um array com a posicao inicial e um subarray como o caminho
   path =  GraphMain.getPath( start.toString(), end.toString());
   //exiba distancia
   if(path.length > 0){
    showTextDistance(calcDistance(path));
    //desenha o melhor caminho
    drawFoundPaths(path);
   }


}

//CALCULA A DISTÂNCIA DO CAMINHO
// path é um retorno de GraphMeain.getPath(A,B)
function calcDistance (path){
    g = GraphMain.graph;

    //calcula a distancia do inicio para o primeiro nó do path
    dist = g[path[0][0]][path[1][0]];

    for(i=0; i< path[1].length -1 ; i++){
        //soma com a distancias dos outros paths
        dist += g[path[1][i]][path[1][i+1]];
    }
    //retrorna apenas como 3 casa decimais
    return dist.toFixed(3);
}

//EXIBE A DISTANCIA NA TELA
showTextDistance = function(dist){
    ctx.font = "15px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Melhor caminho: "+dist+" Km",10,20);
}



//EVENTO DE CLICK DO MOUSE
$(window).on('mouseup', function(e){

   var pos = getMousePos(canvas, e);

   //apenas se o clique for no canvas
   if( e.toElement.id == "myCanvas" ){

       c = convertPointToCord(pos.y, pos.x);

       yourDistiny = getNodeAroundTo(c[0], c[1]);
       clearCanvas();
       drawPaths();
       getLessWay(yourGPSposition, yourDistiny);

    }

});

//CONVERTE UM PONTO DO CANVAS EM CORDENADA
function convertPointToCord(x, y){
    //revertendo o ponto em Lat
    x = (x - offsetX)/-zoom;
    x = (x/1000) - OFFSET_LAT;

    //revertendo o ponto em Log
    y = (y - offsetY)/-zoom;
    y = (y/-1000) - OFFSET_LOG;

    console.log(x, y)

    return [x, y];

}



//CONVERTE UMA CORDENADA EM UM PONTO DO CANVAS
function convertCordToPoint(Lat, Log){

     if(OFFSET_LAT==null)
        OFFSET_LAT = parseFloat(floorFigure(Lat,3)*-1);

    if(OFFSET_LOG==null)
        OFFSET_LOG = parseFloat(floorFigure(Log,2)*-1);

    //covertendo Coord para Ponto

    Lat = (OFFSET_LAT + Lat) * 1000;
    Log = (OFFSET_LOG + Log)*   -1000;

    Lat =  (Lat*-zoom)+offsetX;
    Log =  (Log*-zoom)+offsetY;

    return [Lat, Log];

}


//PEGA A POSICAO DO MOUSE VELATIVO AO CANVAS
function getMousePos(canvas, evt) {

    var rect = canvas.getBoundingClientRect();

    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}


//LOCALIZA O NÓ MAIS PRÓXIMO DA COORDENADA PASSADA
function getNodeAroundTo(Lat, Log){

    g = GraphMain.graph;
    a = Object.keys(g).map(function (key) {return key});

    minDist = Infinity;
    indexNode = -1;
    distCurrent = 0;

    for(i=0; i <g.length-1; i++){
        distCurrent = distLatLong(Lat,Log, g[ a[i] ]["Lat"],g[ a[i] ]["Log"]);

        //modulo
        if(distCurrent<0)
            distCurrent = -distCurrent;

        if(distCurrent < minDist){
            minDist = distCurrent;
            indexNode = a[i];
        }

    }

    return indexNode;
}


//CALCULA A DISTÂNCIA ENTRE DUAS CORDENADAS
//Em: http://blog.adrianoponte.com/calculando-a-distancia-entre-dois-pontos-javascript-html5/
function distLatLong(lat1,lon1,lat2,lon2) {
    var R = 6371; // raio da terra
    var Lati = Math.PI/180*(lat2-lat1);  //Graus  - > Radianos
    var Long = Math.PI/180*(lon2-lon1);
    var a =
        Math.sin(Lati/2) * Math.sin(Lati/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(Long/2) * Math.sin(Long/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // distância en km
    return d;
}
//CONVERTE PARA RADIANO
function toRad(Value) {
    /** Converts numeric degrees to radians */
    return Value * Math.PI / 180;
}

//RESTINGE AS CASAS DECIMAIS
function floorFigure(figure, decimals){
    if (!decimals) decimals = 2;
    var d = Math.pow(10,decimals);
    return (parseInt(figure*d)/d).toFixed(decimals);
};
