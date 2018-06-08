#1::
ClipBoard_1 := GetFromClipboard()
return

#2::
ClipBoard_2 := GetFromClipboard()
return

#3::
ClipBoard_3 := GetFromClipboard()
return

#4::
ClipBoard_4 := GetFromClipboard()
return

#5::
ClipBoard_5 := GetFromClipboard()
return

!1::
SendInput {Raw}%ClipBoard_1%
return

!2::
SendInput {Raw}%ClipBoard_2%
return

!3::
SendInput {Raw}%ClipBoard_3%
return

!4::
SendInput {Raw}%ClipBoard_4%
return

!5::
SendInput {Raw}%ClipBoard_5%
return

GetFromClipboard()
{
  ClipSaved := ClipboardAll ;Save the clipboard
  Clipboard = ;Empty the clipboard
  SendInput, ^c
  ClipWait, 2
  if ErrorLevel
  {
    MsgBox % "Failed attempt to copy text to clipboard."
    return
  }
  NewClipboard := Trim(Clipboard)
  StringReplace, NewClipboard, NewClipBoard, `r`n, `n, All
  Clipboard := ClipSaved ;Restore the clipboard
  ClipSaved = ;Free the memory in case the clipboard was very large.
  return NewClipboard
}
