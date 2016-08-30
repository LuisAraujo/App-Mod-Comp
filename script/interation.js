//evento de mouse
var mouseDown;
var posInicialMouseDown;
var posFinalMouseDown;
var canvas;

$(document).ready(function(){
    canvas = document.getElementById("myCanvas");

    //EVENTO DE CLICK DO MOUSE
    canvas.onmousedown = function(e){
        var pos = getMousePos(canvas, e);

        //apenas se o clique for no canvas
        if( e.toElement.id == "myCanvas" ){
            mouseDown = true;
            posInicialMouseDown = pos;
            posFinalMouseDown = pos;
        }
    };

    canvas.onmousemove = function(e){
        console.log("d");

        if(mouseDown){
            var pos = getMousePos(canvas, e);

            posFinalMouseDown = pos;

            if(posFinalMouseDown.x > posInicialMouseDown.x +10){
                dif =  posFinalMouseDown.x - posInicialMouseDown.x;
                changeOffSet("y","+",dif*0.01);

            }else if(posFinalMouseDown.x < posInicialMouseDown.x -10){
                dif =  posInicialMouseDown.x -posFinalMouseDown.x ;
                changeOffSet("y","-",dif*0.01);

            }

            if(posFinalMouseDown.y > posInicialMouseDown.y +10){
                dif =  posFinalMouseDown.y - posInicialMouseDown.y;
                changeOffSet("x","+",dif*0.01);

            }else if(posFinalMouseDown.y < posInicialMouseDown.y -10){
                dif =  posInicialMouseDown.y -posFinalMouseDown.y ;
                changeOffSet("x","-",dif*0.01);

            }
        }
    }


    canvas.onmouseup = function(e){
        mouseDown = false;
    }


    $("#offsetX_out").click(function(){
        changeOffSet("x", "+", 10)
    });

    $("#offsetX_in").click(function(){
        changeOffSet("x", "-", 10)
    });

    $("#offsetY_out").click(function(){
        changeOffSet("y", "+", 10)
    });

    $("#offsetY_in").click(function(){
        changeOffSet("y", "-", 10)
    });

})
