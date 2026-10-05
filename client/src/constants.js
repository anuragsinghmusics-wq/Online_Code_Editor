export const LANGUAGE_VERSIONS = {
    javascript: "18.15.0", // Ignored by backend (uses *)
    python: "3.10.0",
    java: "15.0.2",
    "c++": "10.2.0",
    // Adding all other languages with arbitrary versions (backend ignores these and uses *)
    typescript: "*", php: "*", ruby: "*", perl: "*", bash: "*", sqlite3: "*",
    rust: "*", go: "*", c: "*", csharp: "*", kotlin: "*", html: "*"
};

export const DEFAULT_CODE = {
    "c++": `#include<iostream>\nusing namespace std;\n\nint main() {\n    cout<<"Hello World";\n    return 0;\n}`,
    python: `print("Hello World")`,
    java: `class Main{\n    public static void main(String[] args){\n        System.out.println("Hello World");\n    }\n}`,
    javascript: `console.log("Hello World")`,
    typescript: `const greeting: string = "Hello World";\nconsole.log(greeting);`,
    php: `<?php\necho "Hello World";\n?>`,
    ruby: `puts "Hello World"`,
    perl: `print "Hello World\\n";`,
    bash: `echo "Hello World"`,
    sqlite3: `-- SQLite\nSELECT 'Hello World' AS message;`,
    rust: `fn main() {\n    println!("Hello World");\n}`,
    go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World")\n}`,
    c: `#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}`,
    csharp: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello World");\n    }\n}`,
    kotlin: `fun main() {\n    println("Hello World")\n}`,
    html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>`,
    nodejs: `{\n  "name": "my-node-app",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "node server.js",\n    "start": "node server.js"\n  },\n  "dependencies": {}\n}`,
};
export const ENTRY_FILES = {
    javascript: 'index.js',
    python: 'script.py',
    java: 'Main.java',
    "c++": 'main.cpp',
    typescript: 'index.ts',
    php: 'index.php',
    ruby: 'index.rb',
    perl: 'index.pl',
    bash: 'index.sh',
    sqlite3: 'index.sql',
    rust: 'main.rs',
    go: 'main.go',
    c: 'main.c',
    csharp: 'Program.cs',
    kotlin: 'Main.kt',
    html: 'index.html',
    nodejs: 'package.json',
};
