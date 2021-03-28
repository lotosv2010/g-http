# gw-http

## usage

## download

```bash
npm i -S gw-http
```

### package

```js
import Http from "gw-http";

```

### Instance

```js
const http = new Http({
  url: "http://localhost:3000",
  headrs: {},
  errorControl: res => {
    console.error("error", res);
    return {
      success: true,
      message: 'error'
    }
  },
  dataControl: res => {
    return res;
  }
});

```

### post

```js
http.post("/login", {
  name: "test",
  age: 18
}).then(res => {
  console.log(res);
});

```

### get

```js
http.get("/getUser",{
    name: "test",
    age: 20
  },
  {
    cache: true
  }
).then(res => {
  console.log(res);
});

```
