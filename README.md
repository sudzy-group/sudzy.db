# @Pouchable
PouchDB empowered by TypeScript

<pre>
npm install pouchdb pouchable --save
</pre>

Include the followings in your project
<pre>
import { Entity, EntityField, Collection } from 'pouchable'
import * as PouchDB from 'pouchdb';
</pre>

Declare your Entity by using decortors!
<pre>
/**
 * Posts 
 */
class Post extends Entity {

    @EntityField({
        mandatory: true,
        group: "default",
        name: "title",
        search_by: [ _.identity ] // need lodash
    })
    title: string;

    @EntityField({
        mandatory: false,
        group: "info",
        name: "author"
    })
    author: string;

    @EntityField({
        mandatory: false,
        group: "info",
        name: "content"
    })
    content: string;
}
</pre>

Declare your collections
<pre>
class Posts extends Collection<Post> {
    public getName(): string {
        return "posts";
    }
}
</pre>

You are ready to work with Pouchable:
<pre>
let db = new PouchDB("default");
let posts = new Posts(db, Post);

posts.insert({ title: "Pouchable is here!!!", author: "Joe"}).then((p) => {
   if (p.title != "Pouchable is here!!!") {
       throw new Error("not really hapenning...");
   }
   console.log(p.title);
}).catch(() => {});
</pre>

# What API is available? 

 <pre>
 posts.insert({ title: "Pouchable is here!!!", author: "Joe"}).then().catch(); 
 users.update(u, { street : "23 e 47th, New York, NY"} ).then().catch(); 
 users.get("_user_id").then().catch(); 
 users.remove(u);
 users.find("title", "search title", { startsWith : true });
 </pre>


