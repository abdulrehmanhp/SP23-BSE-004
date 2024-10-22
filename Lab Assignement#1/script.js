var form = document.querySelector("form");

form.addEventListener("submit",(event)=>{
    event.preventDefault()

    var check = true;

    var inputtag = document.getElementsByTagName("input");

    for(let i=0;i<inputtag.length;i++){
        
        var error = document.getElementById(inputtag[i].id + "error");

        if(inputtag[i].value === ''){
            error.style.display = 'block';
            check = false;
        }
        else{
            error.style.display = 'none'
        }

    }

    if(check){
        alert("Form Submitted Successfully")
        form.submit();
    }

});