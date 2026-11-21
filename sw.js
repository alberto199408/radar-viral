/* Permite instalar RADAR VIRAL como aplicación y abrirla aunque no haya internet.
   Las búsquedas y los vigilados se guardan aparte, en la memoria del navegador.
   No toca las consultas a YouTube: esas siempre van directo a internet. */
var CACHE="virales-v2";

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(["./","./index.html","./manifest.webmanifest","./privacidad.html",
                        "./icon-virales-192.png","./icon-virales-512.png",
                        "./icon-virales-512-maskable.png"].map(function(u){
      return c.add(u).catch(function(){});
    }));
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ if(k.indexOf("virales-")===0 && k!==CACHE) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

/* primero se busca en la red, para que siempre tenga la última versión;
   si no hay internet, se sirve la copia guardada.
   Manda SOLO sobre los archivos de su propia carpeta. */
function esMio(url){
  try{
    var base=new URL("./", self.registration.scope).pathname;
    var u=new URL(url);
    if(u.origin!==self.location.origin) return false;
    if(u.pathname.indexOf(base)!==0) return false;
    return u.pathname.slice(base.length).indexOf("/")<0;
  }catch(e){ return false; }
}

self.addEventListener("fetch", function(e){
  if(e.request.method!=="GET") return;
  if(!esMio(e.request.url)) return;
  e.respondWith(
    fetch(e.request).then(function(r){
      var copia=r.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request,copia).catch(function(){}); });
      return r;
    }).catch(function(){
      return caches.match(e.request).then(function(r){
        return r || caches.match("./index.html");
      });
    })
  );
});
