; doc viewer
+!a::
Clipboard =
Send, {CTRLDOWN}c{CTRLUP}{ESC}
ClipWait, 1
RunWait, "https://microsoft.sharepoint.com/sites/infopedia/pages/layouts/kcdoc.aspx?k=%Clipboard%&docset=1"
KeyWait, a
return

; doc manager
+!s::
Clipboard =
Send, {CTRLDOWN}c{CTRLUP}{ESC}
ClipWait, 1
RunWait, "https://microsoft.sharepoint.com/sites/infopedia/pages/layouts/kcdoc.aspx?k=%Clipboard%&docset=1&m=1"
KeyWait, s
return

; docset viewer
+!z::
Clipboard =
Send, {CTRLDOWN}c{CTRLUP}{ESC}
ClipWait, 1
RunWait, "https://microsoft.sharepoint.com/sites/infopedia/pages/Docset-Viewer.aspx?did=%Clipboard%"
KeyWait, z
return

; docset manager
+!x::
Clipboard =
Send, {CTRLDOWN}c{CTRLUP}{ESC}
ClipWait, 1
RunWait, "https://microsoft.sharepoint.com/sites/infopedia/pages/layouts/kcdoc.aspx?k=%Clipboard%&m=1"
KeyWait, x
return

; page viewer
+!c::
Clipboard =
Send, {CTRLDOWN}c{CTRLUP}{ESC}
ClipWait, 1
RunWait,  "https://microsoft.sharepoint.com/sites/infopedia/pages/layouts/kcdoc.aspx?k=%Clipboard%"
KeyWait, c
return

; Run highlighted url
+!w::
Clipboard =
Send, {CTRLDOWN}c{CTRLUP}{ESC}
ClipWait, 1
RunWait,  "%Clipboard%"
KeyWait, w
return

; Run highlighted C+E task id
+!1::
Clipboard =
Send, {CTRLDOWN}c{CTRLUP}{ESC}
ClipWait, 1
RunWait,  "https://microsoft.sharepoint.com/sites/Infopedia_G01/Lists/CandELearningRequestForm/Item/displayifs.aspx?List=edf5c24f%2D1f09%2D45f5%2D9fcc%2Dad53e3582b49&ID=%Clipboard%&ContentTypeId=0x0100F5481B2B52F255459FE40793ED3BECAC"
KeyWait, 1
return
