
"use strict";

module("BakaTsuki");

/// Load the sample file
/// As file operation is async, load the sample file into dom, and call doneCallback when file loaded
function syncLoadBakaTsukiSampleDoc() {
    let that = this;
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "../testdata/Baka-Tsuki.html", false);
    xhr.send(null);
    let dom = new DOMParser().parseFromString(xhr.responseText, "text/html");
    new HttpClient().setBaseTag("http://www.baka-tsuki.org/project/index.php?title=Web_to_Epub", dom);
    return dom;
}

function getTestDom() {
    return new DOMParser().parseFromString(
        "<x>" +
           "<!-- comment 1 -->" +
           "<h1>T1</h1>" +
           "<div class=\"toc\"></div>" +
           "<!-- comment 2 -->" +
           "<script>\"use strict\"</script>" +
           "<h2>T1.1</h2>" +
        "</x>",
        "text/html"
    );
}

QUnit.test("canParse", function (assert) {
    let parser = new BakaTsukiParser();
    ok(parser.canParse("http://www.baka-tsuki.org/project/index.php?title=Web_to_Epub"));
    notOk(parser.canParse("http://archiveofourown.org/works/123456/chapters/9876543"));
});

QUnit.test("getEpubMetaInfo", function (assert) {
    let parser = new BakaTsukiParser();
    let metaInfo = parser.getEpubMetaInfo(syncLoadBakaTsukiSampleDoc());
    equal(metaInfo.title, "Web to Epub");
    equal(metaInfo.author, "<Unknown>");
    equal(metaInfo.language, "en");
});

QUnit.test("getChapterUrls", function (assert) {
    let parser = new BakaTsukiParser();
    let chapterUrls = parser.getChapterUrls(syncLoadBakaTsukiSampleDoc());
    assert.equal(chapterUrls.length, 1);
    assert.equal(chapterUrls[0].sourceUrl, "http://www.baka-tsuki.org/project/index.php?title=Web_to_Epub");
    assert.equal(chapterUrls[0].title, "Web to Epub");
});

QUnit.test("findContent", function (assert) {
    let parser = new BakaTsukiParser();
    let content = parser.findContent(syncLoadBakaTsukiSampleDoc());
    equal(content.childNodes.length, 21);
    equal(content.childNodes[3].innerText, "Novel Illustrations[edit]");
});

QUnit.test("removeUnwantedElementsFromContentElement", function (assert) {
    let parser = new BakaTsukiParser();
    let dom = getTestDom();
    parser.removeUnwantedElementsFromContentElement(dom.documentElement);
    assert.equal(dom.body.innerHTML, "<x><h1>T1</h1><h2>T1.1</h2></x>");
});

function removeElementsTestDom() {
    return new DOMParser().parseFromString(
        "<x>" +
           "<h1>T1<span class=\"mw-editsection\">Edit 1</span></h1>" +
           "<div class=\"toc\">" +
               "<script>\"use strict\"</script>" +
               "<div class=\"tok\">" +
                   "<h3>T1.1</h3>" +
               "</div>" +
           "</div>" +
           "<h2>T1.1</h2>" +
           "<table><tbody><tr><th>Table4" +
               "<table><tbody><tr><th>Table5</th></tr></tbody></table>" +
           "</th></tr></tbody></table>" +
           "<span class=\"mw-editsection\">Edit 2</span>"+
        "</x>",
        "text/html"
    );
}

QUnit.test("removeElementsSafeToCallMultipleTimes", function (assert) {
    assert.expect(0);
    let dom = removeElementsTestDom();
    let parser = new BakaTsukiParser();
    let tok = dom.getElementsByClassName("tok")[0];
    util.removeElements([tok]);
    util.removeElements([tok]);
});

QUnit.test("removeElementsSafeToCallOnChildOfDeletedElement", function (assert) {
    assert.expect(0);
    let dom = removeElementsTestDom();
    let parser = new BakaTsukiParser();
    let toc = dom.getElementsByClassName("toc")[0];
    let tok = dom.getElementsByClassName("tok")[0];
    util.removeElements([toc]);
    util.removeElements([tok]);
});

QUnit.test("removeComments", function (assert) {
    let dom = new DOMParser().parseFromString(
        "<x>" +
           "<!-- comment 1 -->" +
           "<h1>T1</h1>" +
           "<div class=\"toc\">"+
               "<!-- comment 2 -->" +
           "</div>" +
        "</x>",
        "text/html"
    );

    let parser = new BakaTsukiParser();
    getTestDom();
    util.removeComments(dom.documentElement);
    assert.equal(dom.body.innerHTML, "<x><h1>T1</h1><div class=\"toc\"></div></x>");
});

QUnit.test("removeUnwantedTableWhenSingleTable", function (assert) {
    let dom = new DOMParser().parseFromString(
        "<x>" +
           "<h1>H1</h1>" +
           "<table><tbody><tr><th>Table1</th></tr></tbody></table>" +
        "</x>",
        "text/html"
    );

    let parser = new BakaTsukiParser();
    getTestDom();
    parser.removeUnwantedTable(dom.documentElement);
    assert.equal(dom.body.innerHTML, "<x><h1>H1</h1></x>");
});

QUnit.test("removeUnwantedTableWhenTableNested", function (assert) {
    let dom = new DOMParser().parseFromString(
        "<x>" +
           "<table><tbody><tr><th>Table1</th></tr></tbody></table>" +
           "<table><tbody><tr><th>Table2" +
               "<table><tbody><tr><th>Table3</th></tr></tbody></table>" +
           "</th></tr></tbody></table>" +
           "<table><tbody><tr><th>Table4" +
               "<table><tbody><tr><th>Table5</th></tr></tbody></table>" +
           "</th></tr></tbody></table>" +
        "</x>",
        "text/html"
    );

    let parser = new BakaTsukiParser();
    getTestDom();
    parser.removeUnwantedTable(dom.documentElement);
    assert.equal(dom.body.innerHTML,
        "<x>" +
           "<table><tbody><tr><th>Table1</th></tr></tbody></table>" +
           "<table><tbody><tr><th>Table2" +
               "<table><tbody><tr><th>Table3</th></tr></tbody></table>" +
           "</th></tr></tbody></table>" +
        "</x>");
});

