## usage

### package
```
import Http from "g-http";

```

### Instance
```
const http = new Http({
  url: "http://localhost:3000",
  headrs: {},
  errorControl: res => {
    console.error("error", res);
    return res;
  },
  dataControl: res => {
    return res;
  }
});

```

### post
```
http.post("/login", {
  name: "test",
  age: 18
}).then(res => {
  console.log(res);
});

```

### get

```
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