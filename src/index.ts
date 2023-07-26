import app from "./app.ts";
import env from "./env/index.ts";

const port = env.PORT;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
