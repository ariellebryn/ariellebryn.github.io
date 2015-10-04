var _breakpoint = 1110;
var projects = '.projectslink';
var hashToLink = {
    projects1: projects,
    projects1a: projects,
    projects1b: projects,
    projects2: projects,
    about: '.aboutlink'
}

/* Helpers */
function hasClass(element, selector) {
    var className = " " + selector + " ";
    if ( (" " + element.className + " ").replace(/[\n\t]/g, " ").indexOf(className) > -1 ) {
        return true;
    }

    return false;
}

function removeClass(element, selector) {
    element.className = element.className.replace( new RegExp('(?:^|\\s)'+selector+'(?!\\S)') , '' );
}

var mobileNav = document.getElementById("mobile-nav");
var mobileNavPage = document.getElementById("mobile-nav-page");

var openMenu = function() {
    if (hasClass(mobileNav, "active-menu")) {
        removeClass(mobileNav, "active-menu");
        removeClass(mobileNavPage, "active-menu");
    } else {
        mobileNav.className += " active-menu";
        mobileNavPage.className += " active-menu";
    }

    console.log(mobileNav.classList);
}

mobileNav.onclick = openMenu;

// Remove the current active links
var removeActiveLinks = function() {
    var activeLinks = $(".activelink");

    for (var i = 0; i < activeLinks.length; i++) {
        $(activeLinks[i]).removeClass("activelink");
    }
}


// Set the appropriate active links
var setActiveLink = function(link) {
    if ($(link).hasClass("activelink"))
        return;

    removeActiveLinks();

    var allThisLink = $("." + link.classList[1]);
    for (i = 0; i < allThisLink.length; i++) {
        $(allThisLink[i]).addClass("activelink");
    }
}

// Assign the active link from the current hash in URL
var assignActiveLink = function(hash) {
    var linkClass = hashToLink[hash];

    if (linkClass)
        setActiveLink($(linkClass)[0]);
    else
        removeActiveLinks();
}

var setupLinks = function() {
    for (var i = 0; i < navLinks.length; i++) {
        var link = navLinks[i];
        link.onclick = (function(link) {
            return function() {setActiveLink(link);}
        })(link);
    }
}

var navLinks = document.querySelectorAll(".nav-link");

setupLinks();

var checkHeaderTop = function() {
    var header = document.querySelector(".header");
    var hasTop = hasClass(header, "top");

    if (location.hash === "#top") {
        if (!hasTop) {
            header.className += " top";
        }
    } else {
        if (hasTop) {
            removeClass(header, "top");
        }
    }
}

window.onhashchange = function() {
    if (hasClass(mobileNav, "active-menu")) {
        removeClass(mobileNav, "active-menu");
        removeClass(mobileNavPage, "active-menu");
    }

    checkHeaderTop();
    assignActiveLink(location.hash.slice(1));

    console.log($(".section.active").nextAll(".section"));
}

var checkPageSize = function(isMobile) {
    console.log("Checking page size");

    if ((isMobile != null && !isMobile) || $(window).width() > _breakpoint) {
        $("#fullpage").fullpage({
            anchors: ['top', 'projects1', 'projects2', 'about'],
            css3:true,
            scrollingSpeed: 500,
            sectionSelector: '.section'
        });
    } else {
        $("#fullpage").fullpage({
            anchors: ['top', 'projects1', 'projects1a', 'projects1b', 'projects2', 'about'],
            css3:true,
            scrollingSpeed: 500,
            sectionSelector: '.mobile-section'
        });
    }

    location.hash = "top";
}

var removeFullpageData = function() {
    $.fn.fullpage.destroy(true);
    $("div").removeAttr("data-anchor");
    $("div").removeData("anchor");
    $(".mobile-only").removeClass("fp-section");
    $(".mobile-only").removeClass("fp-table");
}

var fillIn = function(text) {
    $(".fill").text(text);
    if (!$(".fillin").hasClass("open"))
        $(".fillin").addClass("open");
}

/* Project management */
var projects = $(".project");

$(document).ready(function() {
    location.hash = "top";
    removeActiveLinks();
    var pageSize = $(window).width();                

    checkPageSize(null);
    $(window).resize(function() {
        var newPageSize = $(window).width();
        if (pageSize < _breakpoint && newPageSize > _breakpoint) {
            removeFullpageData();
            checkPageSize(false);
            pageSize = newPageSize;
        } else if (pageSize > _breakpoint && newPageSize < _breakpoint) {
            removeFullpageData();
            checkPageSize(true);
            pageSize = newPageSize;
        }
    });


});