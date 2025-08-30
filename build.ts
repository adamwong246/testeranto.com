import fs from "fs";
import path from "path";
import { micromark } from "micromark";
import { gfmTable, gfmTableHtml } from "micromark-extension-gfm-table";
import * as esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";

const template = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- Prism.js CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.css" rel="stylesheet" />

    <!-- load style AFTER prism -->
    <link rel="stylesheet" href="style.css">

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-2BREL4738L"></script>
    <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-2BREL4738L');
    </script>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            Prism.highlightAll();
            
            const parallaxBg = document.querySelector('.parallax-background');
            if (parallaxBg) {
                window.addEventListener('scroll', function() {
                    const scrollPosition = window.pageYOffset;
                    parallaxBg.style.transform = 'translateY(' + scrollPosition + 'px)';
                });
            }
        });
    </script>
    
</head>

<body>

    <div id="root" class="container-fluid" style="padding-bottom: 5rem;">
        <div class="row">

            <div class="col-xs-12 col-sm-12 col-md-12">
                <div id="container-fluid">
                    ${content}
                </div>
            </div>
        

        </div>

    </div>

</div>



</body>
</html>
`;

const processFile = (filePath) => {
  const markdown = fs.readFileSync(filePath, "utf8");
  const html = micromark(markdown, {
    allowDangerousHtml: true,
    extensions: [gfmTable()],
    htmlExtensions: [gfmTableHtml()],
  });
  return template(path.basename(filePath), html);
};

// Build function that can be reused
const buildAll = async () => {
    // Process frontpage
    const frontpageContent = fs.readFileSync(
        "templates/frontpage.html",
        "utf8"
    );
    fs.writeFileSync(
        path.join("./", "index.html"),
        template("Testeranto", frontpageContent)
    );
    console.log("Generated: index.html");

    // Process README.md
    try {
        const readmeHtml = processFile("./README.md");
        fs.writeFileSync(path.join("./", "README.html"), readmeHtml);
        console.log("Generated: README.html");
    } catch (err) {
        console.error("Error processing README.md:", err);
    }

    // Process docs
    const docsHtml = processFile("templates/docs.md");
    fs.writeFileSync(path.join("./", "docs.html"), docsHtml);
    console.log("Generated: docs.html");

    // Process styling using esbuild
    try {
        await esbuild.build({
            entryPoints: ["./src/style.scss"],
            outfile: path.join("./", "style.css"),
            bundle: true,
            minify: true,
            plugins: [sassPlugin()],
            loader: {
                ".ttf": "file",
            },
        });
        console.log("Generated: style.css");
    } catch (err) {
        console.error("Error compiling SCSS with esbuild:", err);
    }
    
    // Copy newStyle.css
    // try {
    //     fs.copyFileSync("newStyle.css", path.join("./", "newStyle.css"));
    //     console.log("Copied: newStyle.css");
    // } catch (err) {
    //     console.error("Error copying newStyle.css:", err);
    // }
};

const main = async () => {
  try {
    // Create docs-output directory if it doesn't exist
    const outDir = "./";
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir);
    }

    // Initial build
    await buildAll();

    // Watch for changes if --watch flag is present
    if (process.argv.includes('--watch')) {
        console.log('Watching for changes...');
        
        // Watch templates
        fs.watch('templates', { recursive: true }, (eventType, filename) => {
            if (filename) {
                console.log(`File ${filename} changed. Rebuilding...`);
                buildAll();
            }
        });
        
        // Watch src directory
        fs.watch('src', { recursive: true }, (eventType, filename) => {
            if (filename) {
                console.log(`File ${filename} changed. Rebuilding...`);
                buildAll();
            }
        });
        
        // Watch README.md
        fs.watch('./README.md', (eventType, filename) => {
            if (filename) {
                console.log(`File ${filename} changed. Rebuilding...`);
                buildAll();
            }
        });
    }

    // Copy fonts from testeranto-stilo package
    // try {
    //     const fontsSourceDir = "./node_modules/testeranto-stilo/fonts";
    //     const fontsDestDir = path.join(outDir, "fonts");

    //     if (fs.existsSync(fontsSourceDir)) {
    //         // Create destination directory if it doesn't exist
    //         if (!fs.existsSync(fontsDestDir)) {
    //             fs.mkdirSync(fontsDestDir, { recursive: true });
    //         }

    //         // Copy all items from source to destination, handling both files and directories
    //         const copyRecursiveSync = function(src: string, dest: string) {
    //             const exists = fs.existsSync(src);
    //             const stats = exists && fs.statSync(src);
    //             const isDirectory = exists && stats.isDirectory();

    //             if (isDirectory) {
    //                 if (!fs.existsSync(dest)) {
    //                     fs.mkdirSync(dest, { recursive: true });
    //                 }
    //                 fs.readdirSync(src).forEach(function(childItemName) {
    //                     copyRecursiveSync(
    //                         path.join(src, childItemName),
    //                         path.join(dest, childItemName)
    //                     );
    //                 });
    //             } else {
    //                 fs.copyFileSync(src, dest);
    //                 console.log(`Copied: ${dest.replace(outDir + '/', '')}`);
    //             }
    //         };

    //         // Copy each item in the fonts directory
    //         const items = fs.readdirSync(fontsSourceDir);
    //         for (const item of items) {
    //             const sourcePath = path.join(fontsSourceDir, item);
    //             const destPath = path.join(fontsDestDir, item);
    //             copyRecursiveSync(sourcePath, destPath);
    //         }
    //     } else {
    //         console.warn(`Fonts directory not found at ${fontsSourceDir}, skipping font copy`);
    //     }
    // } catch (err) {
    //     console.error("Error copying fonts:", err);
    //     // Don't exit the process, as other files may have been generated successfully
    // }
  } catch (err) {
    console.error("Error compiling docs:", err);
    process.exit(1);
  }
};

main();
